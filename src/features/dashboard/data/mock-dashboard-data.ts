// Centralized mocked dashboard data.
// All numbers shown on the dashboard come from this file until the live
// aggregations (Dexie queries / API calls) are wired up. Replacing each
// export below with the real data source is the path to production.

import Currency from '@/enums/currency';

export const dashboardCurrency = Currency.USD;

// Headline metrics shown in the KPI cards at the top of the page.
// `*ChangePercent` fields express the delta vs the previous period and drive
// the trend arrow color.
export const mockSummary = {
  netWorth: 24850.42,
  netWorthChangePercent: 8.2,
  walletsBalance: 6240.18,
  walletsBalanceChangePercent: -3.4,
  goalsBalance: 18610.24,
  goalsBalanceChangePercent: 12.7,
  monthlySpend: 2185.30,
  monthlySpendChangePercent: -5.6,
};

// Month-end snapshots of total net worth for the area chart.
export const mockNetWorthTrend = [
  { date: 'Jun 2025', netWorth: 16320 },
  { date: 'Jul 2025', netWorth: 17100 },
  { date: 'Aug 2025', netWorth: 17890 },
  { date: 'Sep 2025', netWorth: 18450 },
  { date: 'Oct 2025', netWorth: 19610 },
  { date: 'Nov 2025', netWorth: 20480 },
  { date: 'Dec 2025', netWorth: 21320 },
  { date: 'Jan 2026', netWorth: 21810 },
  { date: 'Feb 2026', netWorth: 22640 },
  { date: 'Mar 2026', netWorth: 23120 },
  { date: 'Apr 2026', netWorth: 24010 },
  { date: 'May 2026', netWorth: 24850 },
];

// Where money currently lives — feeds the allocation donut chart.
// `kind` separates goal balances from wallet balances so the legend can
// render a section header for each.
export type AllocationSlice = {
  name: string;
  amount: number;
  kind: 'goal' | 'wallet';
};

export const mockAllocation: AllocationSlice[] = [
  { name: 'Emergency Fund', amount: 8200, kind: 'goal' },
  { name: 'House Down Payment', amount: 6420, kind: 'goal' },
  { name: 'Travel Fund', amount: 2410, kind: 'goal' },
  { name: 'New Laptop', amount: 1580, kind: 'goal' },
  { name: 'Checking', amount: 4120, kind: 'wallet' },
  { name: 'Savings Account', amount: 2120, kind: 'wallet' },
];

// Active goal progress for the leaderboard card.
// `etaMonths` is a forecasted finish line based on current monthly contributions
// and is what makes this view different from the goals page table.
export type DashboardGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  currency: Currency;
  etaMonths: number;
};

export const mockTopGoals: DashboardGoal[] = [
  { id: 'g1', name: 'Emergency Fund', target: 10000, saved: 8200, currency: Currency.USD, etaMonths: 3 },
  { id: 'g2', name: 'New Laptop', target: 2200, saved: 1580, currency: Currency.USD, etaMonths: 2 },
  { id: 'g3', name: 'Travel Fund', target: 5000, saved: 2410, currency: Currency.USD, etaMonths: 7 },
  { id: 'g4', name: 'House Down Payment', target: 25000, saved: 6420, currency: Currency.USD, etaMonths: 22 },
];

// Latest activity feed. Mirrors the shape that get-transactions.ts would return
// once the dashboard is reading live data.
export type DashboardTransaction = {
  id: string;
  type: 'allocate' | 'spend' | 'deallocate';
  label: string;
  counterparty: string;
  amount: number;
  currency: Currency;
  createdAt: Date;
};

export const mockRecentTransactions: DashboardTransaction[] = [
  { id: 't1', type: 'allocate', label: 'Emergency Fund', counterparty: 'from Checking', amount: 500, currency: Currency.USD, createdAt: new Date(2026, 4, 1) },
  { id: 't2', type: 'spend', label: 'Travel Fund', counterparty: 'Flights to Tokyo', amount: 820, currency: Currency.USD, createdAt: new Date(2026, 3, 28) },
  { id: 't3', type: 'allocate', label: 'House Down Payment', counterparty: 'from Savings', amount: 1200, currency: Currency.USD, createdAt: new Date(2026, 3, 25) },
  { id: 't4', type: 'deallocate', label: 'New Laptop', counterparty: 'to Checking', amount: 200, currency: Currency.USD, createdAt: new Date(2026, 3, 20) },
  { id: 't5', type: 'allocate', label: 'New Laptop', counterparty: 'from Checking', amount: 300, currency: Currency.USD, createdAt: new Date(2026, 3, 15) },
];

// Monthly income vs. expense totals for the cashflow bar chart.
export const mockCashflow = [
  { month: 'Dec', income: 4200, expense: 2380 },
  { month: 'Jan', income: 4350, expense: 2510 },
  { month: 'Feb', income: 4400, expense: 2210 },
  { month: 'Mar', income: 4350, expense: 2895 },
  { month: 'Apr', income: 4500, expense: 2050 },
  { month: 'May', income: 4500, expense: 2185 },
];

// Short, contextual nudges shown in the insight strip. In production these
// would be derived from anomaly detection over the user's transactions.
export const mockInsights = [
  "You're spending 5.6% less than last month — keep going.",
  "Emergency Fund is 82% complete. About 3 months to finish at your current pace.",
  "Your Travel Fund saw the largest spend this month (-$820).",
];
