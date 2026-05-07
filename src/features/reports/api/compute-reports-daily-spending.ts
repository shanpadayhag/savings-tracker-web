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
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type DailySpendingPoint = {
  date: Date;
  amount: number;
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
  createdAt?: Date;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const dayKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

// Mirror the rest of the reports: a Spend's outflow side can be a Goal or a
// Wallet. Filtering to Goal-only would erase every wallet-sourced spend from
// the heatmap, even though those days had real spending activity.
const spendAmountInCurrency = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  const fromEntry = transaction.entries.find(entry =>
    (entry.type === TransactionSourceType.Goal
      || entry.type === TransactionSourceType.Wallet)
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  return fromEntry?.amount ?? 0;
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
  const transactions = await documentDBUtil.transaction_list.toArray();

  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < earliest) continue;
    const amount = spendAmountInCurrency(transaction, currency);
    if (amount <= 0) continue;
    const key = dayKeyOf(startOfDay(transaction.createdAt));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.amount = currencyUtil.parse(bucket.amount, currency).add(amount).value;
  }

  return ordered;
};

export default computeReportsDailySpending;
