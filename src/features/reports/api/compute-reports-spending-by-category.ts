// Per-category spending breakdown for the reports page.
// Walks Spend transactions in the active currency, groups outflows from the
// user's accounts (Goal- or Wallet-sourced From entries) by the snapshotted
// `categoryName` on each row, and counts the number of spends in each
// bucket. Per-category change is computed against the same bucket in the
// prior equivalent window (so a brand-new category shows 0% when it had no
// spend before).

import Currency from '@/enums/currency';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type SpendingByCategory = {
  name: string;
  amount: number;
  transactionCount: number;
  changePercent: number;
};

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

// Mirrors the "Others" fallback used elsewhere when a transaction has no
// category snapshot — keeps the donut from rendering an "Uncategorized"
// slice that has no real backing category.
const FALLBACK_CATEGORY_NAME = 'Others';

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
  categoryName?: string;
};

// Match the summary card's spend rule: an outflow can come from a Goal
// (drawing earmarked savings) or directly from a Wallet — both represent the
// user's money leaving. Restricting to Goal-only would silently drop every
// wallet-sourced spend from the category breakdown.
const spendAmountInCurrency = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  const fromEntry = transaction.entries.find(entry =>
    (entry.type === TransactionSourceType.Goal
      || entry.type === TransactionSourceType.Wallet)
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  return fromEntry?.amount ?? 0;
};

type Bucket = { amount: number; transactionCount: number; };
type Buckets = Map<string, Bucket>;

const accumulate = (
  transactions: TransactionRow[],
  currency: Currency,
  startInclusive: Date,
  endExclusive: Date,
): Buckets => {
  const buckets: Buckets = new Map();
  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < startInclusive) continue;
    if (transaction.createdAt >= endExclusive) continue;
    const amount = spendAmountInCurrency(transaction, currency);
    if (amount <= 0) continue;
    const name = transaction.categoryName?.trim() || FALLBACK_CATEGORY_NAME;
    const bucket = buckets.get(name) ?? { amount: 0, transactionCount: 0 };
    bucket.amount = currencyUtil.parse(bucket.amount, currency).add(amount).value;
    bucket.transactionCount += 1;
    buckets.set(name, bucket);
  }
  return buckets;
};

const pctChange = (current: number, prior: number): number => {
  if (prior === 0) return 0;
  return ((current - prior) / Math.abs(prior)) * 100;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
};

const computeReportsSpendingByCategory = async (
  currency: Currency,
  range: ReportRange,
  options: ComputeOptions = {},
): Promise<SpendingByCategory[]> => {
  const now = options.now ?? new Date();
  const months = rangeMonths[range];

  const currentStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const priorStart = new Date(now.getFullYear(), now.getMonth() - (months * 2 - 1), 1);
  const priorEnd = currentStart;

  const transactions = (await documentDBUtil.transaction_list.toArray())
    .filter(isCountedTransaction);
  const current = accumulate(transactions, currency, currentStart, currentEnd);
  const prior = accumulate(transactions, currency, priorStart, priorEnd);

  return Array.from(current.entries()).map(([name, bucket]) => ({
    name,
    amount: bucket.amount,
    transactionCount: bucket.transactionCount,
    changePercent: pctChange(bucket.amount, prior.get(name)?.amount ?? 0),
  }));
};

export default computeReportsSpendingByCategory;
