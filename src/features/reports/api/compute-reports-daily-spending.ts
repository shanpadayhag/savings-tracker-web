// Per-day spending totals for the reports heatmap.
// Returns one row per day for the trailing 12-week window (84 days ending on
// "now"), in the active currency. Days with no spend are emitted with
// `amount: 0` so the heatmap can render the full grid without hole-punching.
//
// Spend semantics match the rest of the reports/dashboard: the From entry on
// a Spend transaction in the active currency is the amount debited that day,
// whether the source is a Goal or a Wallet. Fees and Allocate/Transfer
// entries do not count here — the heatmap is about discretionary spending,
// not internal moves.

import Currency from '@/enums/currency';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type DailySpendingPoint = {
  date: Date;
  amount: number;
  /** Sum of reversal-of-Spend entries that landed on this day (positive
   * number). When set, the heatmap tooltip surfaces "(after $X reversed)"
   * so a quieter cell is explained. */
  reversedAmount?: number;
  /** True when the day's only spend activity was a same-day soft-cancel —
   * the heatmap intensity is 0 but it's worth noting *why* in the tooltip. */
  cancelledOnly?: boolean;
};

const DEFAULT_DAYS = 7 * 12;

type Entry = {
  type: TransactionSourceType;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  type: TransactionType;
  entries: Entry[];
  cancelledAt?: Date;
  reversalOfID?: string;
  createdAt?: Date;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const dayKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

// Mirror the rest of the reports: a Spend's outflow side can be a Goal or a
// Wallet. Filtering to Goal-only would erase every wallet-sourced spend from
// the heatmap, even though those days had real spending activity.
const spendOutflowAmount = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  if (transaction.reversalOfID) return 0;
  const fromEntry = transaction.entries.find(entry =>
    (entry.type === TransactionSourceType.Goal
      || entry.type === TransactionSourceType.Wallet)
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  return fromEntry?.amount ?? 0;
};

// A reversal of a Spend has the original's entries flipped — Goal/Wallet
// moves from `From` to `To`. Surfacing it as a positive "reversed" amount
// lets the heatmap subtract it from the cancel-day's intensity, matching
// the product decision that a reversal lowers spending where it lands.
const spendReversalAmount = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  if (!transaction.reversalOfID) return 0;
  const toEntry = transaction.entries.find(entry =>
    (entry.type === TransactionSourceType.Goal
      || entry.type === TransactionSourceType.Wallet)
    && entry.direction === TransactionDirection.To
    && entry.currency === currency);
  return toEntry?.amount ?? 0;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
  /** Number of trailing days to include (ends on `now`). Defaults to 84. */
  days?: number;
};

const computeReportsDailySpending = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<DailySpendingPoint[]> => {
  const now = options.now ?? new Date();
  const days = Math.max(1, options.days ?? DEFAULT_DAYS);

  const buckets = new Map<string, DailySpendingPoint>();
  const ordered: DailySpendingPoint[] = [];
  const today = startOfDay(now);

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const point: DailySpendingPoint = { date, amount: 0 };
    buckets.set(dayKeyOf(date), point);
    ordered.push(point);
  }

  const earliest = ordered[0].date;
  // We need the cancelled rows too — `cancelledOnly` flagging requires
  // knowing which days had a soft-cancel even though the day's intensity
  // ends up at 0. Live rows feed both the spend and the reversal totals.
  const allTransactions = await documentDBUtil.transaction_list.toArray();
  const cancelledByDay = new Map<string, boolean>();

  const positiveByDay = new Map<string, number>();
  const reversedByDay = new Map<string, number>();

  for (const transaction of allTransactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < earliest) continue;
    const dayKey = dayKeyOf(startOfDay(transaction.createdAt));

    if (!isCountedTransaction(transaction)) {
      // Soft-cancelled spend: track for the "(cancelled)" tooltip on
      // otherwise-empty days. Other types just no-op here.
      if (spendOutflowAmount({ ...transaction, cancelledAt: undefined }, currency) > 0) {
        cancelledByDay.set(dayKey, true);
      }
      continue;
    }

    const positive = spendOutflowAmount(transaction, currency);
    if (positive > 0) {
      const next = currencyUtil.parse(positiveByDay.get(dayKey) ?? 0, currency).add(positive).value;
      positiveByDay.set(dayKey, next);
    }
    const reversed = spendReversalAmount(transaction, currency);
    if (reversed > 0) {
      const next = currencyUtil.parse(reversedByDay.get(dayKey) ?? 0, currency).add(reversed).value;
      reversedByDay.set(dayKey, next);
    }
  }

  for (const point of ordered) {
    const key = dayKeyOf(point.date);
    const positive = positiveByDay.get(key) ?? 0;
    const reversed = reversedByDay.get(key) ?? 0;
    const net = currencyUtil.parse(positive, currency).subtract(reversed).value;
    point.amount = net > 0 ? net : 0;
    if (reversed > 0) point.reversedAmount = reversed;
    if (point.amount === 0 && reversed === 0 && cancelledByDay.get(key)) {
      point.cancelledOnly = true;
    }
  }

  return ordered;
};

export default computeReportsDailySpending;
