// Centralized mocked reports data, partitioned by currency.
// Every aggregation here is keyed by `Currency`. Components pass the active
// currency from `useActiveCurrency()` and a range preset; the accessor
// returns the slice. Aggregations never sum across currencies.

import Currency from '@/enums/currency';

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

// -- Cashflow base series ---------------------------------------------------

type CashflowMonth = { month: string; income: number; expense: number; };

const baseCashflows: Partial<Record<Currency, CashflowMonth[]>> = {
  [Currency.USD]: [
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
  ],
  [Currency.Euro]: [
    { month: 'Jun 2025', income: 1500, expense: 850 },
    { month: 'Jul 2025', income: 1500, expense: 920 },
    { month: 'Aug 2025', income: 1500, expense: 760 },
    { month: 'Sep 2025', income: 1550, expense: 1080 },
    { month: 'Oct 2025', income: 1500, expense: 720 },
    { month: 'Nov 2025', income: 1550, expense: 940 },
    { month: 'Dec 2025', income: 1600, expense: 1010 },
    { month: 'Jan 2026', income: 1500, expense: 880 },
    { month: 'Feb 2026', income: 1550, expense: 740 },
    { month: 'Mar 2026', income: 1500, expense: 1020 },
    { month: 'Apr 2026', income: 1600, expense: 870 },
    { month: 'May 2026', income: 1600, expense: 980 },
  ],
  [Currency.Peso]: [
    { month: 'Jun 2025', income: 30000, expense: 18500 },
    { month: 'Jul 2025', income: 30500, expense: 19800 },
    { month: 'Aug 2025', income: 31000, expense: 17200 },
    { month: 'Sep 2025', income: 30500, expense: 22600 },
    { month: 'Oct 2025', income: 31500, expense: 18000 },
    { month: 'Nov 2025', income: 31500, expense: 20100 },
    { month: 'Dec 2025', income: 32000, expense: 19500 },
    { month: 'Jan 2026', income: 32500, expense: 21800 },
    { month: 'Feb 2026', income: 33000, expense: 18400 },
    { month: 'Mar 2026', income: 32500, expense: 24300 },
    { month: 'Apr 2026', income: 34000, expense: 20100 },
    { month: 'May 2026', income: 34000, expense: 22340 },
  ],
};

// -- Goal growth base series ------------------------------------------------

type GoalGrowthRow = { month: string; [goalKey: string]: string | number; };

const baseGoalGrowth: Partial<Record<Currency, GoalGrowthRow[]>> = {
  [Currency.USD]: [
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
  ],
  [Currency.Euro]: [
    { month: 'Jun 2025', euTrip: 1200, backupFund: 1800 },
    { month: 'Jul 2025', euTrip: 1450, backupFund: 1950 },
    { month: 'Aug 2025', euTrip: 1700, backupFund: 2100 },
    { month: 'Sep 2025', euTrip: 1950, backupFund: 2250 },
    { month: 'Oct 2025', euTrip: 2200, backupFund: 2400 },
    { month: 'Nov 2025', euTrip: 2400, backupFund: 2520 },
    { month: 'Dec 2025', euTrip: 2600, backupFund: 2640 },
    { month: 'Jan 2026', euTrip: 2750, backupFund: 2770 },
    { month: 'Feb 2026', euTrip: 2900, backupFund: 2860 },
    { month: 'Mar 2026', euTrip: 3000, backupFund: 2940 },
    { month: 'Apr 2026', euTrip: 3100, backupFund: 3010 },
    { month: 'May 2026', euTrip: 3200, backupFund: 3070 },
  ],
  [Currency.Peso]: [
    { month: 'Jun 2025', familyEmergency: 30000, motorcycle: 12000, houseRepairs: 6000 },
    { month: 'Jul 2025', familyEmergency: 33000, motorcycle: 14000, houseRepairs: 7500 },
    { month: 'Aug 2025', familyEmergency: 36000, motorcycle: 16000, houseRepairs: 8800 },
    { month: 'Sep 2025', familyEmergency: 39000, motorcycle: 18000, houseRepairs: 10000 },
    { month: 'Oct 2025', familyEmergency: 42000, motorcycle: 19500, houseRepairs: 11500 },
    { month: 'Nov 2025', familyEmergency: 45000, motorcycle: 21000, houseRepairs: 12800 },
    { month: 'Dec 2025', familyEmergency: 48000, motorcycle: 22500, houseRepairs: 14000 },
    { month: 'Jan 2026', familyEmergency: 51000, motorcycle: 23800, houseRepairs: 15200 },
    { month: 'Feb 2026', familyEmergency: 53500, motorcycle: 25000, houseRepairs: 16100 },
    { month: 'Mar 2026', familyEmergency: 56000, motorcycle: 26000, houseRepairs: 17000 },
    { month: 'Apr 2026', familyEmergency: 58000, motorcycle: 27000, houseRepairs: 17800 },
    { month: 'May 2026', familyEmergency: 60000, motorcycle: 28000, houseRepairs: 18500 },
  ],
};

export type GoalSeriesMeta = { key: string; label: string; color: string; };

const goalSeriesMeta: Partial<Record<Currency, readonly GoalSeriesMeta[]>> = {
  [Currency.USD]: [
    { key: 'emergencyFund', label: 'Emergency Fund', color: 'var(--chart-1)' },
    { key: 'houseDownPayment', label: 'House Down Payment', color: 'var(--chart-2)' },
    { key: 'travelFund', label: 'Travel Fund', color: 'var(--chart-3)' },
    { key: 'newLaptop', label: 'New Laptop', color: 'var(--chart-5)' },
  ],
  [Currency.Euro]: [
    { key: 'euTrip', label: 'EU Trip', color: 'var(--chart-1)' },
    { key: 'backupFund', label: 'Backup Fund', color: 'var(--chart-2)' },
  ],
  [Currency.Peso]: [
    { key: 'familyEmergency', label: 'Family Emergency', color: 'var(--chart-1)' },
    { key: 'motorcycle', label: 'Motorcycle', color: 'var(--chart-2)' },
    { key: 'houseRepairs', label: 'House Repairs', color: 'var(--chart-3)' },
  ],
};

// -- Spending categories ----------------------------------------------------

type CategoryBreakdown = {
  name: string;
  amount: number;
  /** Percent change vs the equivalent prior period. */
  changePercent: number;
  transactionCount: number;
};

const baseCategoryBreakdown: Partial<Record<Currency, CategoryBreakdown[]>> = {
  [Currency.USD]: [
    { name: 'Groceries', amount: 4820, changePercent: -4.1, transactionCount: 84 },
    { name: 'Restaurants', amount: 2940, changePercent: 12.4, transactionCount: 51 },
    { name: 'Transport', amount: 1860, changePercent: -2.8, transactionCount: 32 },
    { name: 'Bills & Utilities', amount: 5220, changePercent: 1.5, transactionCount: 28 },
    { name: 'Entertainment', amount: 1240, changePercent: 18.6, transactionCount: 19 },
    { name: 'Shopping', amount: 2150, changePercent: -7.3, transactionCount: 22 },
    { name: 'Health', amount: 780, changePercent: 5.2, transactionCount: 8 },
    { name: 'Other', amount: 950, changePercent: -10.0, transactionCount: 14 },
  ],
  [Currency.Euro]: [
    { name: 'Travel', amount: 2100, changePercent: 22.5, transactionCount: 8 },
    { name: 'Restaurants', amount: 980, changePercent: 6.3, transactionCount: 24 },
    { name: 'Groceries', amount: 1450, changePercent: -2.1, transactionCount: 31 },
    { name: 'Transport', amount: 380, changePercent: -8.4, transactionCount: 14 },
    { name: 'Other', amount: 290, changePercent: -3.0, transactionCount: 6 },
  ],
  [Currency.Peso]: [
    { name: 'Groceries', amount: 38000, changePercent: -3.5, transactionCount: 64 },
    { name: 'Bills & Utilities', amount: 42000, changePercent: 2.0, transactionCount: 24 },
    { name: 'Transport', amount: 14500, changePercent: -1.8, transactionCount: 48 },
    { name: 'Restaurants', amount: 18200, changePercent: 8.7, transactionCount: 36 },
    { name: 'Shopping', amount: 12400, changePercent: -5.4, transactionCount: 18 },
    { name: 'Health', amount: 6200, changePercent: 3.1, transactionCount: 6 },
    { name: 'Other', amount: 8500, changePercent: -7.0, transactionCount: 12 },
  ],
};

// -- Heatmap (per-currency daily spend totals) ------------------------------

// Daily heatmap remains a fixed 12-week window regardless of the global range
// — the grid only stays legible at one fixed size.
const buildHeatmapData = (seedOffset: number, density: number) => {
  const days = 7 * 12;
  const today = new Date();
  const data: { date: Date; amount: number; }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Pseudo-random but deterministic so the grid is stable across renders.
    // Real data would aggregate transactions per day for the active currency.
    const dayOfWeek = date.getDay();
    const seed = (date.getDate() * 7 + date.getMonth() * 31 + seedOffset) % 100;
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.6 : 1;
    const isQuiet = seed < 25;
    const amount = isQuiet ? 0 : Math.round((seed * 4 + 20) * weekendBoost * density);

    data.push({ date, amount });
  }
  return data;
};

const heatmaps: Partial<Record<Currency, { date: Date; amount: number; }[]>> = {
  [Currency.USD]: buildHeatmapData(0, 1),
  [Currency.Euro]: buildHeatmapData(13, 0.4),
  [Currency.Peso]: buildHeatmapData(31, 9),
};

// -- Public accessor --------------------------------------------------------

const scaleForRange = (range: ReportRange) => rangeMonths[range] / 12;

const pctChange = (current: number, prior: number) => {
  if (prior === 0) return 0;
  return ((current - prior) / prior) * 100;
};

export const reportsData = {
  /** Aggregated KPI values for the selected window in a single currency. */
  summary(currency: Currency, range: ReportRange) {
    const months = rangeMonths[range];
    const series = baseCashflows[currency] ?? [];
    const slice = series.slice(-months);
    const totalIncome = slice.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = slice.reduce((sum, m) => sum + m.expense, 0);
    const netSaved = totalIncome - totalExpense;
    const savingsRate = totalIncome === 0 ? 0 : (netSaved / totalIncome) * 100;

    const priorSlice = series.slice(-months * 2, -months);
    const priorIncome = priorSlice.reduce((sum, m) => sum + m.income, 0);
    const priorExpense = priorSlice.reduce((sum, m) => sum + m.expense, 0);
    const priorNet = priorIncome - priorExpense;

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
  cashflow(currency: Currency, range: ReportRange) {
    const months = rangeMonths[range];
    const series = baseCashflows[currency] ?? [];
    return series.slice(-months).map(m => ({
      month: m.month.split(' ')[0],
      income: m.income,
      expense: m.expense,
      savingsRate: m.income === 0 ? 0 : ((m.income - m.expense) / m.income) * 100,
    }));
  },

  /** Stacked snapshots of each goal's balance per month. */
  goalGrowth(currency: Currency, range: ReportRange) {
    const months = rangeMonths[range];
    const series = baseGoalGrowth[currency] ?? [];
    return series.slice(-months).map(row => ({
      ...row,
      month: (row.month as string).split(' ')[0],
    }));
  },

  /** Series metadata for the goal-growth chart (label/color per goal). */
  goalSeriesMeta(currency: Currency): readonly GoalSeriesMeta[] {
    return goalSeriesMeta[currency] ?? [];
  },

  /** Spending sliced by category, scaled down for shorter ranges so totals
   * roughly match the cashflow numbers above. */
  spendingByCategory(currency: Currency, range: ReportRange) {
    const factor = scaleForRange(range);
    const categories = baseCategoryBreakdown[currency] ?? [];
    return categories.map(cat => ({
      ...cat,
      amount: Math.round(cat.amount * factor),
      transactionCount: Math.max(1, Math.round(cat.transactionCount * factor)),
    }));
  },

  /** Daily spending grid for the heatmap. Range-independent on purpose. */
  heatmap(currency: Currency) {
    return heatmaps[currency] ?? [];
  },
};
