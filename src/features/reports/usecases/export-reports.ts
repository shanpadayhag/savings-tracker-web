import Currency from '@/enums/currency';
import computeReportsCashflow, { ReportsCashflowPoint } from '@/features/reports/api/compute-reports-cashflow';
import computeReportsGoalGrowth, { GoalGrowthPoint, GoalGrowthSeries } from '@/features/reports/api/compute-reports-goal-growth';
import computeReportsSpendingByCategory, { SpendingByCategory } from '@/features/reports/api/compute-reports-spending-by-category';
import computeReportsSummary, { ReportsSummary } from '@/features/reports/api/compute-reports-summary';
import { ReportRange, reportRangeLabel } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';

type ReportsSnapshot = {
  summary: ReportsSummary;
  cashflow: ReportsCashflowPoint[];
  spendingByCategory: SpendingByCategory[];
  goalGrowth: { data: GoalGrowthPoint[]; series: GoalGrowthSeries[]; };
};

const aggregateReportsSnapshot = async (
  currency: Currency,
  range: ReportRange,
): Promise<ReportsSnapshot> => {
  const [summary, cashflow, spendingByCategory, goalGrowth] = await Promise.all([
    computeReportsSummary(currency, range),
    computeReportsCashflow(currency, range),
    computeReportsSpendingByCategory(currency, range),
    computeReportsGoalGrowth(currency, range),
  ]);
  return { summary, cashflow, spendingByCategory, goalGrowth };
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
