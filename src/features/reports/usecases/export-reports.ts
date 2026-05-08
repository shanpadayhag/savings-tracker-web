import Currency from '@/enums/currency';
import computeReportsCashflow, { ReportsCashflowPoint } from '@/features/reports/api/compute-reports-cashflow';
import computeReportsGoalGrowth, { GoalGrowthPoint, GoalGrowthSeries } from '@/features/reports/api/compute-reports-goal-growth';
import computeReportsSpendingByCategory, { SpendingByCategory } from '@/features/reports/api/compute-reports-spending-by-category';
import computeReportsSummary, { ReportsSummary } from '@/features/reports/api/compute-reports-summary';
import { ReportRange, reportRangeLabel } from '@/features/reports/data/mock-reports-data';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

type TransactionExportRow = {
  date: Date;
  type: TransactionType;
  fromName: string | null;
  toName: string | null;
  amount: number | null;
  receivedAmount: number | null;
  fee: number | null;
  currency: Currency | null;
  categoryName: string | null;
  notes: string | null;
  status: 'active' | 'cancelled' | 'reversed' | 'reversal';
  cancelledAt: Date | null;
  reversedAt: Date | null;
  reversalOfID: string | null;
};

type ReportsSnapshot = {
  summary: ReportsSummary;
  cashflow: ReportsCashflowPoint[];
  spendingByCategory: SpendingByCategory[];
  goalGrowth: { data: GoalGrowthPoint[]; series: GoalGrowthSeries[]; };
  transactions: TransactionExportRow[];
};

const isUserAccount = (type: TransactionSourceType): boolean =>
  type === TransactionSourceType.Wallet || type === TransactionSourceType.Goal;

// Pulls every transaction whose createdAt falls within the report's window
// — including soft-cancelled rows so the export remains an honest audit log.
// The resolved view collapses each row to a single line: primary From/To
// names, the From-side amount, the To-side amount when it differs (Convert),
// the Internal/To fee, and a status flag the consumer can filter on.
const aggregateTransactions = async (
  currency: Currency,
  range: ReportRange,
): Promise<TransactionExportRow[]> => {
  const months = rangeMonths[range];
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const windowEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const all = await documentDBUtil.transaction_list.toArray();
  const matching = all.filter(row => {
    if (!row.createdAt) return false;
    if (row.createdAt < windowStart || row.createdAt >= windowEnd) return false;
    // Drop rows that touch only foreign currencies — keeps the export
    // single-currency like the rest of the report sections.
    return row.entries.some(entry => entry.currency === currency);
  });

  return matching
    .map(row => {
      const fromEntry = row.entries.find(entry =>
        isUserAccount(entry.type) && entry.direction === TransactionDirection.From);
      const toEntry = row.entries.find(entry =>
        isUserAccount(entry.type) && entry.direction === TransactionDirection.To);
      const feeEntry = row.entries.find(entry =>
        entry.type === TransactionSourceType.Internal && entry.direction === TransactionDirection.To);

      const amount = fromEntry?.amount ?? toEntry?.amount ?? null;
      const receivedAmount = fromEntry && toEntry && fromEntry.currency !== toEntry.currency
        ? toEntry.amount
        : null;
      const status: TransactionExportRow['status'] = row.cancelledAt
        ? 'cancelled'
        : row.reversedAt
          ? 'reversed'
          : row.reversalOfID
            ? 'reversal'
            : 'active';

      return {
        date: row.createdAt!,
        type: row.type,
        fromName: fromEntry?.name ?? null,
        toName: toEntry?.name ?? null,
        amount,
        receivedAmount,
        fee: feeEntry?.amount ?? null,
        currency: fromEntry?.currency ?? toEntry?.currency ?? null,
        categoryName: row.categoryName ?? null,
        notes: row.notes,
        status,
        cancelledAt: row.cancelledAt ?? null,
        reversedAt: row.reversedAt ?? null,
        reversalOfID: row.reversalOfID ?? null,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

const aggregateReportsSnapshot = async (
  currency: Currency,
  range: ReportRange,
): Promise<ReportsSnapshot> => {
  const [summary, cashflow, spendingByCategory, goalGrowth, transactions] = await Promise.all([
    computeReportsSummary(currency, range),
    computeReportsCashflow(currency, range),
    computeReportsSpendingByCategory(currency, range),
    computeReportsGoalGrowth(currency, range),
    aggregateTransactions(currency, range),
  ]);
  return { summary, cashflow, spendingByCategory, goalGrowth, transactions };
};

// RFC 4180: wrap in double quotes when the cell contains comma, quote, or newline,
// and double up any inner quotes.
const escapeCsvCell = (cell: unknown): string => {
  const text = cell == null ? '' : String(cell);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const toCsvRow = (cells: unknown[]): string => cells.map(escapeCsvCell).join(',');

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;
const formatPercentagePoints = (value: number): string => `${value.toFixed(2)}pp`;

const buildSummarySection = (snapshot: ReportsSnapshot, currency: Currency): string[] => {
  const summary = snapshot.summary;
  return [
    '# Summary',
    toCsvRow(['Metric', 'Value', 'Change vs prior period']),
    toCsvRow(['Total Income', currencyUtil.format(summary.totalIncome, currency), formatPercent(summary.incomeChangePercent)]),
    toCsvRow(['Total Spending', currencyUtil.format(summary.totalExpense, currency), formatPercent(summary.expenseChangePercent)]),
    toCsvRow(['Net Saved', currencyUtil.format(summary.netSaved, currency), formatPercent(summary.netChangePercent)]),
    toCsvRow(['Savings Rate', formatPercent(summary.savingsRate), formatPercentagePoints(summary.savingsRateChangePercent)]),
  ];
};

const buildCashflowSection = (snapshot: ReportsSnapshot, currency: Currency): string[] => {
  const rows = ['# Cashflow', toCsvRow(['Month', 'Income', 'Expense', 'Savings rate'])];
  for (const point of snapshot.cashflow) {
    rows.push(toCsvRow([
      point.month,
      currencyUtil.format(point.income, currency),
      currencyUtil.format(point.expense, currency),
      formatPercent(point.savingsRate),
    ]));
  }
  return rows;
};

const buildSpendingByCategorySection = (snapshot: ReportsSnapshot, currency: Currency): string[] => {
  const rows = ['# Spending by category', toCsvRow(['Category', 'Amount', 'Transactions', 'Change vs prior period'])];
  // Snapshot stays untouched; we sort a shallow copy so the CSV reads top-spend-first.
  const sortedByAmountDesc = [...snapshot.spendingByCategory].sort((a, b) => b.amount - a.amount);
  for (const bucket of sortedByAmountDesc) {
    rows.push(toCsvRow([
      bucket.name,
      currencyUtil.format(bucket.amount, currency),
      bucket.transactionCount,
      formatPercent(bucket.changePercent),
    ]));
  }
  return rows;
};

const buildGoalGrowthSection = (snapshot: ReportsSnapshot, currency: Currency): string[] => {
  const series = snapshot.goalGrowth.series;
  const headerCells: unknown[] = ['Month', ...series.map(goal => goal.label)];
  const rows = ['# Goal growth', toCsvRow(headerCells)];
  for (const point of snapshot.goalGrowth.data) {
    const cells: unknown[] = [point.month];
    for (const goal of series) {
      const value = point[goal.key];
      cells.push(typeof value === 'number' ? currencyUtil.format(value, currency) : '');
    }
    rows.push(toCsvRow(cells));
  }
  return rows;
};

const formatAmountCell = (amount: number | null, currency: Currency | null): string => {
  if (amount === null || currency === null) return '';
  return currencyUtil.format(amount, currency);
};

const buildTransactionsSection = (snapshot: ReportsSnapshot): string[] => {
  const rows = ['# Transactions', toCsvRow([
    'Date', 'Type', 'From', 'To', 'Amount', 'Received', 'Fee', 'Currency',
    'Category', 'Notes', 'Status', 'Cancelled at', 'Reversed at', 'Reversal of',
  ])];
  for (const row of snapshot.transactions) {
    rows.push(toCsvRow([
      row.date.toISOString(),
      row.type,
      row.fromName ?? '',
      row.toName ?? '',
      formatAmountCell(row.amount, row.currency),
      formatAmountCell(row.receivedAmount, row.currency),
      formatAmountCell(row.fee, row.currency),
      row.currency ?? '',
      row.categoryName ?? '',
      row.notes ?? '',
      row.status,
      row.cancelledAt ? row.cancelledAt.toISOString() : '',
      row.reversedAt ? row.reversedAt.toISOString() : '',
      row.reversalOfID ?? '',
    ]));
  }
  return rows;
};

const buildReportsCsv = (
  snapshot: ReportsSnapshot,
  currency: Currency,
  range: ReportRange,
): string => {
  const preamble = [
    '# Savings Tracker — Reports',
    `# Range: ${reportRangeLabel[range]}`,
    `# Currency: ${currency}`,
    `# Generated: ${new Date().toISOString()}`,
  ];
  const sections = [
    buildSummarySection(snapshot, currency),
    buildCashflowSection(snapshot, currency),
    buildSpendingByCategorySection(snapshot, currency),
    buildGoalGrowthSection(snapshot, currency),
    buildTransactionsSection(snapshot),
  ];
  return [preamble.join('\n'), ...sections.map(rows => rows.join('\n'))].join('\n\n') + '\n';
};

const formatTimestampForFilename = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
};

const triggerCsvDownload = (csv: string, filename: string): void => {
  // Prepend a UTF-8 BOM so Excel opens non-ASCII (€, ₱, accents) cleanly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const exportReports = async (currency: Currency, range: ReportRange): Promise<string> => {
  const snapshot = await aggregateReportsSnapshot(currency, range);
  const csv = buildReportsCsv(snapshot, currency, range);
  const filename = `savings-tracker-reports-${range}-${formatTimestampForFilename(new Date())}.csv`;
  triggerCsvDownload(csv, filename);
  return filename;
};

export default exportReports;
