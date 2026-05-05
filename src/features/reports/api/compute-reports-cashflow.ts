// Per-month cashflow points for the reports page, augmented with a savings
// rate so the chart's secondary axis can plot it. Reuses the dashboard
// cashflow compute (same income/expense semantics) and adds savingsRate =
// (income - expense) / income, expressed as a percentage. Returns 0 when
// income is 0 so the line doesn't spike or NaN.

import Currency from '@/enums/currency';
import computeCashflow from '@/features/dashboard/api/compute-cashflow';
import { ReportRange } from '@/features/reports/data/mock-reports-data';

export type ReportsCashflowPoint = {
  month: string;
  income: number;
  expense: number;
  savingsRate: number;
};

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
};

const computeReportsCashflow = async (
  currency: Currency,
  range: ReportRange,
  options: ComputeOptions = {},
): Promise<ReportsCashflowPoint[]> => {
  const points = await computeCashflow(currency, {
    now: options.now,
    months: rangeMonths[range],
  });

  return points.map(point => ({
    month: point.month,
    income: point.income,
    expense: point.expense,
    savingsRate: point.income === 0
      ? 0
      : ((point.income - point.expense) / point.income) * 100,
  }));
};

export default computeReportsCashflow;
