// Centralized mocked reports data.
// Numbers are designed so the four range presets (1M / 3M / 6M / 12M) tell
// slightly different stories — verifying the UI reacts to the global range
// selector even though the underlying source is hand-coded.

import Currency from '@/enums/currency';

export const reportsCurrency = Currency.USD;

export type ReportRange = '1m' | '3m' | '6m' | '12m';

export const reportRangeLabel: Record<ReportRange, string> = {
  '1m': 'Last month',
  '3m': 'Last 3 months',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
};

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

// Base 12-month cashflow series. All other range-aware datasets derive from
// slicing the tail of these series, so the totals roll up consistently across
// every chart on the page.
const baseMonthlyCashflow = [
  { month: 'Jun 2025', income: 4200, expense: 2380 },
  { month: 'Jul 2025', income: 4250, expense: 2510 },
  { month: 'Aug 2025', income: 4300, expense: 2210 },
  { month: 'Sep 2025', income: 4280, expense: 2895 },
  { month: 'Oct 2025', income: 4400, expense: 2050 },
  { month: 'Nov 2025', income: 4400, expense: 2540 },
  { month: 'Dec 2025', income: 4500, expense: 2810 },
  { month: 'Jan 2026', income: 4350, expense: 2450 },
  { month: 'Feb 2026', income: 4400, expense: 2210 },
  { month: 'Mar 2026', income: 4350, expense: 2895 },
  { month: 'Apr 2026', income: 4500, expense: 2050 },
  { month: 'May 2026', income: 4500, expense: 2185 },
];

// Per-month balance snapshots for each goal — drives the stacked area chart.
const baseGoalGrowth = [
  { month: 'Jun 2025', emergencyFund: 4200, houseDownPayment: 1500, travelFund: 600, newLaptop: 200 },
  { month: 'Jul 2025', emergencyFund: 4700, houseDownPayment: 2000, travelFund: 800, newLaptop: 400 },
  { month: 'Aug 2025', emergencyFund: 5200, houseDownPayment: 2400, travelFund: 1000, newLaptop: 600 },
  { month: 'Sep 2025', emergencyFund: 5700, houseDownPayment: 2900, travelFund: 1200, newLaptop: 800 },
  { month: 'Oct 2025', emergencyFund: 6200, houseDownPayment: 3400, travelFund: 1400, newLaptop: 1000 },
  { month: 'Nov 2025', emergencyFund: 6600, houseDownPayment: 3900, travelFund: 1600, newLaptop: 1100 },
  { month: 'Dec 2025', emergencyFund: 7000, houseDownPayment: 4400, travelFund: 1800, newLaptop: 1200 },
  { month: 'Jan 2026', emergencyFund: 7300, houseDownPayment: 4900, travelFund: 1900, newLaptop: 1300 },
  { month: 'Feb 2026', emergencyFund: 7600, houseDownPayment: 5400, travelFund: 2050, newLaptop: 1400 },
  { month: 'Mar 2026', emergencyFund: 7800, houseDownPayment: 5800, travelFund: 2150, newLaptop: 1450 },
  { month: 'Apr 2026', emergencyFund: 8000, houseDownPayment: 6100, travelFund: 2280, newLaptop: 1520 },
  { month: 'May 2026', emergencyFund: 8200, houseDownPayment: 6420, travelFund: 2410, newLaptop: 1580 },
];

export const goalSeriesMeta = [
  { key: 'emergencyFund', label: 'Emergency Fund', color: 'var(--chart-1)' },
  { key: 'houseDownPayment', label: 'House Down Payment', color: 'var(--chart-2)' },
  { key: 'travelFund', label: 'Travel Fund', color: 'var(--chart-3)' },
  { key: 'newLaptop', label: 'New Laptop', color: 'var(--chart-5)' },
] as const;

// Spending broken down by mocked categories. These would normally come from
// tagging transaction notes, but the schema doesn't carry categories yet.
type CategoryBreakdown = {
  name: string;
  amount: number;
  /** Percent change vs the equivalent prior period. */
  changePercent: number;
  transactionCount: number;
};

const baseCategoryBreakdown: CategoryBreakdown[] = [
  { name: 'Groceries', amount: 4820, changePercent: -4.1, transactionCount: 84 },
  { name: 'Restaurants', amount: 2940, changePercent: 12.4, transactionCount: 51 },
  { name: 'Transport', amount: 1860, changePercent: -2.8, transactionCount: 32 },
  { name: 'Bills & Utilities', amount: 5220, changePercent: 1.5, transactionCount: 28 },
  { name: 'Entertainment', amount: 1240, changePercent: 18.6, transactionCount: 19 },
  { name: 'Shopping', amount: 2150, changePercent: -7.3, transactionCount: 22 },
  { name: 'Health', amount: 780, changePercent: 5.2, transactionCount: 8 },
  { name: 'Other', amount: 950, changePercent: -10.0, transactionCount: 14 },
];

// Daily spend totals for the heatmap. Always shows the trailing 12 weeks
// regardless of the global range — heatmaps need a fixed grid to stay legible.
const buildHeatmapData = () => {
  const days = 7 * 12;
  const today = new Date();
  const data: { date: Date; amount: number; }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Pseudo-random but deterministic spend amounts so the heatmap is stable
    // across renders. Real data would come from aggregating transactions.
    const dayOfWeek = date.getDay();
    const seed = (date.getDate() * 7 + date.getMonth() * 31) % 100;
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.6 : 1;
    const isQuiet = seed < 25;
    const amount = isQuiet ? 0 : Math.round((seed * 4 + 20) * weekendBoost);

    data.push({ date, amount });
  }
  return data;
};

const baseHeatmap = buildHeatmapData();

const scaleForRange = (range: ReportRange) => rangeMonths[range] / 12;

export const reportsData = {
  /** Aggregated KPI values for the selected window. */
  summary(range: ReportRange) {
    const months = rangeMonths[range];
    const slice = baseMonthlyCashflow.slice(-months);
    const totalIncome = slice.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = slice.reduce((sum, m) => sum + m.expense, 0);
    const netSaved = totalIncome - totalExpense;
    const savingsRate = totalIncome === 0 ? 0 : (netSaved / totalIncome) * 100;

    // Pre-period delta — compare against the equivalent window immediately
    // before this one. If we don't have enough history, fall back to 0.
    const priorSlice = baseMonthlyCashflow.slice(-months * 2, -months);
    const priorIncome = priorSlice.reduce((sum, m) => sum + m.income, 0);
    const priorExpense = priorSlice.reduce((sum, m) => sum + m.expense, 0);
    const priorNet = priorIncome - priorExpense;

    const pctChange = (current: number, prior: number) => {
      if (prior === 0) return 0;
      return ((current - prior) / prior) * 100;
    };

    return {
      totalIncome,
      totalExpense,
      netSaved,
      savingsRate,
      incomeChangePercent: pctChange(totalIncome, priorIncome),
      expenseChangePercent: pctChange(totalExpense, priorExpense),
      netChangePercent: pctChange(netSaved, priorNet),
      savingsRateChangePercent: priorIncome === 0
        ? 0
        : savingsRate - ((priorNet / priorIncome) * 100),
    };
  },

  /** Cashflow + savings rate per month, for the composed chart. */
  cashflow(range: ReportRange) {
    const months = rangeMonths[range];
    return baseMonthlyCashflow.slice(-months).map(m => ({
      month: m.month.split(' ')[0],
      income: m.income,
      expense: m.expense,
      savingsRate: m.income === 0 ? 0 : ((m.income - m.expense) / m.income) * 100,
    }));
  },

  /** Stacked snapshots of each goal's balance per month. */
  goalGrowth(range: ReportRange) {
    const months = rangeMonths[range];
    return baseGoalGrowth.slice(-months).map(row => ({
      ...row,
      month: row.month.split(' ')[0],
    }));
  },

  /** Spending sliced by category, scaled down for shorter ranges so totals
   * roughly match the cashflow numbers above. */
  spendingByCategory(range: ReportRange) {
    const factor = scaleForRange(range);
    return baseCategoryBreakdown.map(cat => ({
      ...cat,
      amount: Math.round(cat.amount * factor),
      transactionCount: Math.max(1, Math.round(cat.transactionCount * factor)),
    }));
  },

  /** Daily spending grid for the heatmap. Range-independent on purpose. */
  heatmap() {
    return baseHeatmap;
  },
};
