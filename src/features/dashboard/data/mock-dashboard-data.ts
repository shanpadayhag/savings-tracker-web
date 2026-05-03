// Centralized mocked dashboard data, partitioned by currency.
// Aggregations never sum across currencies — every export below is keyed by
// `Currency`, and components should pass the active currency from
// `useActiveCurrency()` to read their slice. Replace these per-currency
// branches with real `WHERE currency = ?` queries when wiring live data.

import Currency from '@/enums/currency';

// -- KPI summaries ----------------------------------------------------------

type Summary = {
  netWorth: number;
  netWorthChangePercent: number;
  walletsBalance: number;
  walletsBalanceChangePercent: number;
  goalsBalance: number;
  goalsBalanceChangePercent: number;
  monthlySpend: number;
  monthlySpendChangePercent: number;
};

const emptySummary: Summary = {
  netWorth: 0, netWorthChangePercent: 0,
  walletsBalance: 0, walletsBalanceChangePercent: 0,
  goalsBalance: 0, goalsBalanceChangePercent: 0,
  monthlySpend: 0, monthlySpendChangePercent: 0,
};

const summaries: Partial<Record<Currency, Summary>> = {
  [Currency.USD]: {
    netWorth: 24850.42, netWorthChangePercent: 8.2,
    walletsBalance: 6240.18, walletsBalanceChangePercent: -3.4,
    goalsBalance: 18610.24, goalsBalanceChangePercent: 12.7,
    monthlySpend: 2185.30, monthlySpendChangePercent: -5.6,
  },
  [Currency.Euro]: {
    netWorth: 8420.30, netWorthChangePercent: 4.1,
    walletsBalance: 2150.40, walletsBalanceChangePercent: 1.8,
    goalsBalance: 6269.90, goalsBalanceChangePercent: 6.2,
    monthlySpend: 980.50, monthlySpendChangePercent: 12.3,
  },
  [Currency.Peso]: {
    netWorth: 145000, netWorthChangePercent: 11.5,
    walletsBalance: 38500, walletsBalanceChangePercent: -2.1,
    goalsBalance: 106500, goalsBalanceChangePercent: 18.4,
    monthlySpend: 22340, monthlySpendChangePercent: -8.2,
  },
};

// -- Net worth trend --------------------------------------------------------

type NetWorthPoint = { date: string; netWorth: number; };

const netWorthTrends: Partial<Record<Currency, NetWorthPoint[]>> = {
  [Currency.USD]: [
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
  ],
  [Currency.Euro]: [
    { date: 'Jun 2025', netWorth: 6800 },
    { date: 'Jul 2025', netWorth: 6920 },
    { date: 'Aug 2025', netWorth: 7050 },
    { date: 'Sep 2025', netWorth: 7180 },
    { date: 'Oct 2025', netWorth: 7320 },
    { date: 'Nov 2025', netWorth: 7480 },
    { date: 'Dec 2025', netWorth: 7610 },
    { date: 'Jan 2026', netWorth: 7790 },
    { date: 'Feb 2026', netWorth: 7950 },
    { date: 'Mar 2026', netWorth: 8120 },
    { date: 'Apr 2026', netWorth: 8280 },
    { date: 'May 2026', netWorth: 8420 },
  ],
  [Currency.Peso]: [
    { date: 'Jun 2025', netWorth: 92000 },
    { date: 'Jul 2025', netWorth: 98500 },
    { date: 'Aug 2025', netWorth: 104200 },
    { date: 'Sep 2025', netWorth: 110800 },
    { date: 'Oct 2025', netWorth: 116400 },
    { date: 'Nov 2025', netWorth: 121000 },
    { date: 'Dec 2025', netWorth: 125700 },
    { date: 'Jan 2026', netWorth: 130200 },
    { date: 'Feb 2026', netWorth: 134800 },
    { date: 'Mar 2026', netWorth: 138500 },
    { date: 'Apr 2026', netWorth: 142100 },
    { date: 'May 2026', netWorth: 145000 },
  ],
};

// -- Allocation donut -------------------------------------------------------

export type AllocationSlice = {
  name: string;
  amount: number;
  kind: 'goal' | 'wallet';
};

const allocations: Partial<Record<Currency, AllocationSlice[]>> = {
  [Currency.USD]: [
    { name: 'Emergency Fund', amount: 8200, kind: 'goal' },
    { name: 'House Down Payment', amount: 6420, kind: 'goal' },
    { name: 'Travel Fund', amount: 2410, kind: 'goal' },
    { name: 'New Laptop', amount: 1580, kind: 'goal' },
    { name: 'Checking', amount: 4120, kind: 'wallet' },
    { name: 'Savings Account', amount: 2120, kind: 'wallet' },
  ],
  [Currency.Euro]: [
    { name: 'EU Trip', amount: 3200, kind: 'goal' },
    { name: 'Backup Fund', amount: 3070, kind: 'goal' },
    { name: 'Revolut', amount: 1450, kind: 'wallet' },
    { name: 'N26', amount: 700, kind: 'wallet' },
  ],
  [Currency.Peso]: [
    { name: 'Family Emergency', amount: 60000, kind: 'goal' },
    { name: 'Motorcycle', amount: 28000, kind: 'goal' },
    { name: 'House Repairs', amount: 18500, kind: 'goal' },
    { name: 'BPI', amount: 25500, kind: 'wallet' },
    { name: 'GCash', amount: 13000, kind: 'wallet' },
  ],
};

// -- Top goals --------------------------------------------------------------

export type DashboardGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  currency: Currency;
  etaMonths: number;
};

const topGoals: Partial<Record<Currency, DashboardGoal[]>> = {
  [Currency.USD]: [
    { id: 'g-usd-1', name: 'Emergency Fund', target: 10000, saved: 8200, currency: Currency.USD, etaMonths: 3 },
    { id: 'g-usd-2', name: 'New Laptop', target: 2200, saved: 1580, currency: Currency.USD, etaMonths: 2 },
    { id: 'g-usd-3', name: 'Travel Fund', target: 5000, saved: 2410, currency: Currency.USD, etaMonths: 7 },
    { id: 'g-usd-4', name: 'House Down Payment', target: 25000, saved: 6420, currency: Currency.USD, etaMonths: 22 },
  ],
  [Currency.Euro]: [
    { id: 'g-eur-1', name: 'EU Trip', target: 4000, saved: 3200, currency: Currency.Euro, etaMonths: 4 },
    { id: 'g-eur-2', name: 'Backup Fund', target: 6000, saved: 3070, currency: Currency.Euro, etaMonths: 14 },
  ],
  [Currency.Peso]: [
    { id: 'g-php-1', name: 'Family Emergency', target: 80000, saved: 60000, currency: Currency.Peso, etaMonths: 5 },
    { id: 'g-php-2', name: 'Motorcycle', target: 60000, saved: 28000, currency: Currency.Peso, etaMonths: 11 },
    { id: 'g-php-3', name: 'House Repairs', target: 25000, saved: 18500, currency: Currency.Peso, etaMonths: 4 },
  ],
};

// -- Recent transactions ----------------------------------------------------

export type DashboardTransaction = {
  id: string;
  type: 'allocate' | 'spend' | 'deallocate';
  label: string;
  counterparty: string;
  amount: number;
  currency: Currency;
  createdAt: Date;
};

const recentTransactions: Partial<Record<Currency, DashboardTransaction[]>> = {
  [Currency.USD]: [
    { id: 't-usd-1', type: 'allocate', label: 'Emergency Fund', counterparty: 'from Checking', amount: 500, currency: Currency.USD, createdAt: new Date(2026, 4, 1) },
    { id: 't-usd-2', type: 'spend', label: 'Travel Fund', counterparty: 'Flights to Tokyo', amount: 820, currency: Currency.USD, createdAt: new Date(2026, 3, 28) },
    { id: 't-usd-3', type: 'allocate', label: 'House Down Payment', counterparty: 'from Savings', amount: 1200, currency: Currency.USD, createdAt: new Date(2026, 3, 25) },
    { id: 't-usd-4', type: 'deallocate', label: 'New Laptop', counterparty: 'to Checking', amount: 200, currency: Currency.USD, createdAt: new Date(2026, 3, 20) },
    { id: 't-usd-5', type: 'allocate', label: 'New Laptop', counterparty: 'from Checking', amount: 300, currency: Currency.USD, createdAt: new Date(2026, 3, 15) },
  ],
  [Currency.Euro]: [
    { id: 't-eur-1', type: 'allocate', label: 'EU Trip', counterparty: 'from Revolut', amount: 250, currency: Currency.Euro, createdAt: new Date(2026, 4, 2) },
    { id: 't-eur-2', type: 'spend', label: 'EU Trip', counterparty: 'Hotel deposit', amount: 410, currency: Currency.Euro, createdAt: new Date(2026, 3, 27) },
    { id: 't-eur-3', type: 'allocate', label: 'Backup Fund', counterparty: 'from N26', amount: 180, currency: Currency.Euro, createdAt: new Date(2026, 3, 22) },
  ],
  [Currency.Peso]: [
    { id: 't-php-1', type: 'allocate', label: 'Family Emergency', counterparty: 'from BPI', amount: 5000, currency: Currency.Peso, createdAt: new Date(2026, 4, 1) },
    { id: 't-php-2', type: 'spend', label: 'Motorcycle', counterparty: 'Service & oil', amount: 1800, currency: Currency.Peso, createdAt: new Date(2026, 3, 26) },
    { id: 't-php-3', type: 'allocate', label: 'House Repairs', counterparty: 'from GCash', amount: 3500, currency: Currency.Peso, createdAt: new Date(2026, 3, 24) },
    { id: 't-php-4', type: 'deallocate', label: 'Family Emergency', counterparty: 'to BPI', amount: 2000, currency: Currency.Peso, createdAt: new Date(2026, 3, 18) },
  ],
};

// -- Cashflow ---------------------------------------------------------------

type CashflowPoint = { month: string; income: number; expense: number; };

const cashflows: Partial<Record<Currency, CashflowPoint[]>> = {
  [Currency.USD]: [
    { month: 'Dec', income: 4200, expense: 2380 },
    { month: 'Jan', income: 4350, expense: 2510 },
    { month: 'Feb', income: 4400, expense: 2210 },
    { month: 'Mar', income: 4350, expense: 2895 },
    { month: 'Apr', income: 4500, expense: 2050 },
    { month: 'May', income: 4500, expense: 2185 },
  ],
  [Currency.Euro]: [
    { month: 'Dec', income: 1500, expense: 920 },
    { month: 'Jan', income: 1500, expense: 880 },
    { month: 'Feb', income: 1550, expense: 740 },
    { month: 'Mar', income: 1500, expense: 1020 },
    { month: 'Apr', income: 1600, expense: 870 },
    { month: 'May', income: 1600, expense: 980 },
  ],
  [Currency.Peso]: [
    { month: 'Dec', income: 32000, expense: 19500 },
    { month: 'Jan', income: 32500, expense: 21800 },
    { month: 'Feb', income: 33000, expense: 18400 },
    { month: 'Mar', income: 32500, expense: 24300 },
    { month: 'Apr', income: 34000, expense: 20100 },
    { month: 'May', income: 34000, expense: 22340 },
  ],
};

// -- Insight nudges ---------------------------------------------------------

const insights: Partial<Record<Currency, string[]>> = {
  [Currency.USD]: [
    "You're spending 5.6% less than last month — keep going.",
    "Emergency Fund is 82% complete. About 3 months to finish at your current pace.",
    "Your Travel Fund saw the largest spend this month (-$820).",
  ],
  [Currency.Euro]: [
    "Spending is up 12.3% this month — mostly the hotel deposit on EU Trip.",
    "EU Trip is 80% funded. Two more contributions and you're there.",
    "Your Backup Fund grew steadily for 6 months running.",
  ],
  [Currency.Peso]: [
    "Spending is down 8.2% this month — nice work.",
    "Family Emergency is 75% funded. About 5 months to fully fund at this pace.",
    "Your House Repairs goal is your fastest-growing this quarter.",
  ],
};

// -- Public accessor --------------------------------------------------------

// Single per-currency accessor. Components call into here with the active
// currency from context and never see the raw maps above. Adding a currency
// later is one entry per map; UI code stays untouched.
export const dashboardData = {
  summary: (currency: Currency): Summary => summaries[currency] ?? emptySummary,
  netWorthTrend: (currency: Currency): NetWorthPoint[] => netWorthTrends[currency] ?? [],
  allocation: (currency: Currency): AllocationSlice[] => allocations[currency] ?? [],
  topGoals: (currency: Currency): DashboardGoal[] => topGoals[currency] ?? [],
  recentTransactions: (currency: Currency): DashboardTransaction[] => recentTransactions[currency] ?? [],
  cashflow: (currency: Currency): CashflowPoint[] => cashflows[currency] ?? [],
  insights: (currency: Currency): string[] => insights[currency] ?? [],
};
