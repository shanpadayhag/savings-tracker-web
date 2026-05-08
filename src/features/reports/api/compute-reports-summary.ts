// Aggregated income/expense KPIs for the reports page over a selected window
// in a single currency, plus deltas vs. the prior equivalent period.
//
// Income / expense semantics mirror the dashboard cashflow chart:
//   - Income: External → Wallet entries on Allocate transactions in the
//     active currency, plus the destination side of cross-currency Convert
//     transactions where the destination wallet is in the active currency
//     (fresh inflow into this ledger from another currency's books).
//   - Expense: From entries on Spend transactions in the active currency
//     where the source is a Goal or a Wallet, plus Internal/To fees
//     attributed back to a source wallet in the same currency, plus the
//     source side of cross-currency Convert transactions where the source
//     wallet is in the active currency (outflow leaving this ledger for
//     another currency's books).
// Each currency's ledger is tracked independently — aggregations never sum
// across currencies, and a Convert is treated as a transfer between two
// separate ledgers (outflow on source side, inflow on destination).

import Currency from '@/enums/currency';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type ReportsSummary = {
  totalIncome: number;
  totalExpense: number;
  netSaved: number;
  savingsRate: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  netChangePercent: number;
  /** Difference in percentage points between current and prior savings rate. */
  savingsRateChangePercent: number;
};

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

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

// Currency conversions bring fresh money into the destination currency's
// ledger from a different ledger. From the destination's perspective, the
// converted-in amount is real inflow, even though no value was created (the
// source currency lost it). Each currency's books are tracked independently.
const convertIncomeFor = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Convert) return 0;
  const toEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.To
    && entry.currency === currency);
  if (!toEntry) return 0;
  // Defensive: only count cross-currency conversions. A same-currency
  // Convert (shouldn't occur — Transfer covers that) wouldn't represent
  // money entering this ledger from outside.
  const sourceWallet = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From);
  if (sourceWallet?.currency === currency) return 0;
  return toEntry.amount;
};

// Symmetric source-side rule: the converted-out amount is value leaving the
// source currency's ledger entirely. From that ledger's perspective it's an
// outflow — same shape as the destination-side income. The fee is counted
// separately by feeExpenseFor (so this returns the wallet/from amount only,
// no double-counting).
const convertExpenseFor = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Convert) return 0;
  const fromEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  if (!fromEntry) return 0;
  const destWallet = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.To);
  if (destWallet?.currency === currency) return 0;
  return fromEntry.amount;
};

// A Spend's outflow is whichever side of the row is the user's own account —
// Goal (drawing from earmarked savings) or Wallet (drawing directly). We
// accept either, since both represent money leaving the user's hands. Anchor
// rows like Internal/External never count as the source of a Spend.
const spendExpenseFor = (transaction: TransactionRow, currency: Currency): number => {
  if (transaction.type !== TransactionType.Spend) return 0;
  const fromEntry = transaction.entries.find(entry =>
    (entry.type === TransactionSourceType.Goal
      || entry.type === TransactionSourceType.Wallet)
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  return fromEntry?.amount ?? 0;
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

const sumWindow = (
  transactions: TransactionRow[],
  currency: Currency,
  startInclusive: Date,
  endExclusive: Date,
): { income: number; expense: number; } => {
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < startInclusive) continue;
    if (transaction.createdAt >= endExclusive) continue;
    const inc = incomeFor(transaction, currency)
      + convertIncomeFor(transaction, currency);
    const exp = spendExpenseFor(transaction, currency)
      + feeExpenseFor(transaction, currency)
      + convertExpenseFor(transaction, currency);
    if (inc > 0) income = currencyUtil.parse(income, currency).add(inc).value;
    if (exp > 0) expense = currencyUtil.parse(expense, currency).add(exp).value;
  }
  return { income, expense };
};

const pctChange = (current: number, prior: number): number => {
  if (prior === 0) return 0;
  return ((current - prior) / Math.abs(prior)) * 100;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
};

const computeReportsSummary = async (
  currency: Currency,
  range: ReportRange,
  options: ComputeOptions = {},
): Promise<ReportsSummary> => {
  const now = options.now ?? new Date();
  const months = rangeMonths[range];

  const currentStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const priorStart = new Date(now.getFullYear(), now.getMonth() - (months * 2 - 1), 1);
  const priorEnd = currentStart;

  const transactions = (await documentDBUtil.transaction_list.toArray())
    .filter(isCountedTransaction);
  const current = sumWindow(transactions, currency, currentStart, currentEnd);
  const prior = sumWindow(transactions, currency, priorStart, priorEnd);

  const netSaved = currencyUtil.parse(current.income, currency).subtract(current.expense).value;
  const priorNet = currencyUtil.parse(prior.income, currency).subtract(prior.expense).value;
  const savingsRate = current.income === 0 ? 0 : (netSaved / current.income) * 100;
  const priorSavingsRate = prior.income === 0 ? 0 : (priorNet / prior.income) * 100;

  return {
    totalIncome: current.income,
    totalExpense: current.expense,
    netSaved,
    savingsRate,
    incomeChangePercent: pctChange(current.income, prior.income),
    expenseChangePercent: pctChange(current.expense, prior.expense),
    netChangePercent: pctChange(netSaved, priorNet),
    savingsRateChangePercent: prior.income === 0 ? 0 : savingsRate - priorSavingsRate,
  };
};

export default computeReportsSummary;
