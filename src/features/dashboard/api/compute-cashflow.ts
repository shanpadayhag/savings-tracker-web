import Currency from '@/enums/currency';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import { format } from 'date-fns';

export type CashflowPoint = {
  /** Short label for the bar's X-axis tick (e.g. "May"). */
  month: string;
  /** Money flowing into the active currency from outside the system. */
  income: number;
  /** Money leaving the active currency through spends and fees. */
  expense: number;
};

const DEFAULT_MONTHS = 6;

type Entry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  type: TransactionType;
  entries: Entry[];
  createdAt?: Date;
};

const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;

const incomeFor = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Allocate) return 0;
  const fromEntry = transaction.entries.find(entry => entry.direction === TransactionDirection.From);
  if (fromEntry?.type !== TransactionSourceType.External) return 0;
  const toEntry = transaction.entries.find(entry =>
    entry.direction === TransactionDirection.To
    && entry.type === TransactionSourceType.Wallet
    && entry.currency === currency);
  return toEntry?.amount ?? 0;
};

const spendExpenseFor = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  const goalEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Goal
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  return goalEntry?.amount ?? 0;
};

const feeExpenseFor = (transaction: TransactionRow, currency: Currency): number => {
  const feeEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Internal
    && entry.direction === TransactionDirection.To
    && entry.currency === currency);
  if (!feeEntry) return 0;
  const sourceWallet = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From);
  if (sourceWallet?.currency !== currency) return 0;
  return feeEntry.amount;
};

type Buckets = Map<string, { income: number; expense: number; }>;

const buildEmptyBuckets = (now: Date, months: number): { keys: string[]; buckets: Buckets; } => {
  const keys: string[] = [];
  const buckets: Buckets = new Map();
  const cursor = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  for (let i = 0; i < months; i += 1) {
    const key = monthKeyOf(cursor);
    keys.push(key);
    buckets.set(key, { income: 0, expense: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { keys, buckets };
};

const accumulateInto = (
  buckets: Buckets,
  key: string,
  income: number,
  expense: number,
  currency: Currency,
): void => {
  const bucket = buckets.get(key);
  if (!bucket) return;
  if (income > 0) {
    bucket.income = currencyUtil.parse(bucket.income, currency).add(income).value;
  }
  if (expense > 0) {
    bucket.expense = currencyUtil.parse(bucket.expense, currency).add(expense).value;
  }
};

const labelFor = (key: string): string => {
  const [year, monthIndex] = key.split('-').map(Number);
  return format(new Date(year, monthIndex, 1), 'MMM');
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
  /** Number of months to include, anchored on `now`. Defaults to 6. */
  months?: number;
};

const computeCashflow = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<CashflowPoint[]> => {
  const now = options.now ?? new Date();
  const months = Math.max(1, options.months ?? DEFAULT_MONTHS);

  const transactions = await documentDBUtil.transaction_list.toArray();
  const { keys, buckets } = buildEmptyBuckets(now, months);
  const earliestKey = keys[0];

  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    const key = monthKeyOf(transaction.createdAt);
    if (key < earliestKey) continue;
    if (!buckets.has(key)) continue;

    const income = incomeFor(transaction, currency);
    const expense = spendExpenseFor(transaction, currency)
      + feeExpenseFor(transaction, currency);
    accumulateInto(buckets, key, income, expense, currency);
  }

  return keys.map(key => ({
    month: labelFor(key),
    ...buckets.get(key)!,
  }));
};

export default computeCashflow;
