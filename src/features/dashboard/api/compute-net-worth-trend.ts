import Currency from '@/enums/currency';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import { format } from 'date-fns';

export type NetWorthPoint = {
  /** Display label for the X axis, e.g. "May 2026". */
  date: string;
  /** Net worth in the active currency at the end of that month (or "now" for
   * the current month). */
  netWorth: number;
};

const MAX_MONTHS = 24;

type TransactionEntry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  entries: TransactionEntry[];
  createdAt?: Date;
};

type WalletRow = { currency: Currency; currentAmount: number; };
type GoalRow = { currency: Currency; savedAmount: number; };

const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;

// Net change to net worth (in the active currency) caused by one transaction.
// Mirrors the wallet/goal/fee accounting in computeDashboardSummary so the
// historical replay reconciles with the eagerly-maintained current values.
const netWorthDeltaOf = (transaction: TransactionRow, currency: Currency): number => {
  const sourceWalletEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From);

  let delta = 0;

  for (const entry of transaction.entries) {
    if (entry.type === TransactionSourceType.Wallet && entry.currency === currency) {
      delta += entry.direction === TransactionDirection.To ? entry.amount : -entry.amount;
      continue;
    }

    if (entry.type === TransactionSourceType.Goal && entry.currency === currency) {
      delta += entry.direction === TransactionDirection.To ? entry.amount : -entry.amount;
      continue;
    }

    if (entry.type === TransactionSourceType.Internal
      && entry.direction === TransactionDirection.To
      && sourceWalletEntry?.currency === currency) {
      delta -= entry.amount;
    }
  }

  return delta;
};

const sumCurrentNetWorth = (
  wallets: WalletRow[],
  goals: GoalRow[],
  currency: Currency,
): number => {
  const walletTotal = wallets
    .filter(wallet => wallet.currency === currency)
    .reduce((sum, wallet) => currencyUtil.parse(sum, currency).add(wallet.currentAmount).value, 0);
  const goalTotal = goals
    .filter(goal => goal.currency === currency)
    .reduce((sum, goal) => currencyUtil.parse(sum, currency).add(goal.savedAmount).value, 0);
  return currencyUtil.parse(walletTotal, currency).add(goalTotal).value;
};

const aggregateMonthlyDeltas = (
  transactions: TransactionRow[],
  currency: Currency,
): Map<string, number> => {
  const deltasByMonth = new Map<string, number>();
  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    const key = monthKeyOf(transaction.createdAt);
    const delta = netWorthDeltaOf(transaction, currency);
    if (delta === 0) continue;
    const previous = deltasByMonth.get(key) ?? 0;
    deltasByMonth.set(key, currencyUtil.parse(previous, currency).add(delta).value);
  }
  return deltasByMonth;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
  /** Cap on the number of monthly points returned (oldest first). Defaults
   * to 24 months. */
  maxMonths?: number;
};

const computeNetWorthTrend = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<NetWorthPoint[]> => {
  const now = options.now ?? new Date();
  const cap = Math.max(1, options.maxMonths ?? MAX_MONTHS);

  const [wallets, goals, transactions] = await Promise.all([
    documentDBUtil.wallet_list.toArray(),
    documentDBUtil.goal_list.toArray(),
    documentDBUtil.transaction_list.toArray(),
  ]);

  const currentNetWorth = sumCurrentNetWorth(wallets, goals, currency);
  const deltasByMonth = aggregateMonthlyDeltas(transactions, currency);

  // The eagerly-maintained wallet/goal balances already reflect every
  // transaction in the ledger — including any post-dated ones whose month
  // sits in the future. The cursor only walks backward from the current
  // month, so future-month deltas would never be reversed and would leak
  // into every historical anchor. Pre-roll them off the live anchor here.
  const currentMonthKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth(), 1));
  let runningNetWorth = currentNetWorth;
  for (const [key, delta] of deltasByMonth) {
    if (key > currentMonthKey) {
      runningNetWorth = currencyUtil.parse(runningNetWorth, currency).subtract(delta).value;
    }
  }

  // Walk monthly anchors backward from "now". The current month's anchor is
  // `now` itself (live value); older anchors are the last day of each month.
  const points: NetWorthPoint[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i < cap; i += 1) {
    const anchor = i === 0 ? now : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    points.push({
      date: format(anchor, 'MMM yyyy'),
      netWorth: runningNetWorth,
    });

    const thisMonthDelta = deltasByMonth.get(monthKeyOf(cursor)) ?? 0;
    runningNetWorth = currencyUtil.parse(runningNetWorth, currency)
      .subtract(thisMonthDelta).value;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return points.reverse();
};

export default computeNetWorthTrend;
