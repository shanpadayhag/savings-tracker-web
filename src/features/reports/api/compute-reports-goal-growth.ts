// Per-month saved-amount snapshots per goal for the reports goal-growth
// stacked area chart. Anchors on each goal's current `savedAmount` (from the
// `goal_list` document table) and walks transactions backward, subtracting
// each month's net goal-side delta to recover the historical balance. Mirrors
// the approach in compute-net-worth-trend so historical replay reconciles
// with the eagerly-maintained current values.
//
// Only Active goals in the active currency are included — the chart's
// purpose is "how each currently-tracked goal grew," and completed/archived
// goals end at zero, which would render as a noisy slice that drops out.

import Currency from '@/enums/currency';
import GoalStatus from '@/features/goals/enums/goal-status';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import { format } from 'date-fns';

export type GoalGrowthSeries = {
  key: string;
  label: string;
  color: string;
};

export type GoalGrowthPoint = {
  month: string;
  [goalKey: string]: string | number;
};

const rangeMonths: Record<ReportRange, number> = {
  '1m': 1, '3m': 3, '6m': 6, '12m': 12,
};

const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

type Entry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  entries: Entry[];
  createdAt?: Date;
};

type GoalRow = {
  id?: string;
  name: string;
  currency: Currency;
  status: GoalStatus;
  savedAmount: number;
  createdAt?: Date;
};

const monthKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;

const goalDeltaOf = (
  transaction: TransactionRow,
  goalID: string,
  currency: Currency,
): number => {
  let delta = 0;
  for (const entry of transaction.entries) {
    if (entry.type !== TransactionSourceType.Goal) continue;
    if (entry.sourceID !== goalID) continue;
    if (entry.currency !== currency) continue;
    delta += entry.direction === TransactionDirection.To ? entry.amount : -entry.amount;
  }
  return delta;
};

const aggregateMonthlyDeltas = (
  transactions: TransactionRow[],
  goalID: string,
  currency: Currency,
): Map<string, number> => {
  const deltas = new Map<string, number>();
  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    const delta = goalDeltaOf(transaction, goalID, currency);
    if (delta === 0) continue;
    const key = monthKeyOf(transaction.createdAt);
    const previous = deltas.get(key) ?? 0;
    deltas.set(key, currencyUtil.parse(previous, currency).add(delta).value);
  }
  return deltas;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
};

const computeReportsGoalGrowth = async (
  currency: Currency,
  range: ReportRange,
  options: ComputeOptions = {},
): Promise<{ data: GoalGrowthPoint[]; series: GoalGrowthSeries[]; }> => {
  const now = options.now ?? new Date();
  const months = rangeMonths[range];

  const [goalsRaw, allTransactions] = await Promise.all([
    documentDBUtil.goal_list.toArray(),
    documentDBUtil.transaction_list.toArray(),
  ]);
  const transactions = allTransactions.filter(isCountedTransaction);

  const goals: GoalRow[] = goalsRaw
    .filter(goal => goal.id && goal.currency === currency && goal.status === GoalStatus.Active)
    .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

  const series: GoalGrowthSeries[] = goals.map((goal, index) => ({
    key: goal.id!,
    label: goal.name,
    color: palette[index % palette.length],
  }));

  const deltasByGoal = new Map<string, Map<string, number>>();
  for (const goal of goals) {
    deltasByGoal.set(goal.id!, aggregateMonthlyDeltas(transactions, goal.id!, currency));
  }

  // The eagerly-maintained `goal.savedAmount` already reflects every
  // transaction in the ledger — including any post-dated ones whose month
  // sits in the future. Future-month deltas are also captured by
  // `aggregateMonthlyDeltas` but the cursor never visits those keys (it walks
  // backward from the current month), so they'd never be reversed and would
  // leak into every historical anchor. Pre-roll the future deltas off the
  // running balance once at the top so the loop's "now" anchor reflects the
  // present moment, not a hypothetical future state.
  const currentMonthKey = monthKeyOf(new Date(now.getFullYear(), now.getMonth(), 1));
  const running = new Map<string, number>();
  for (const goal of goals) {
    let balance = goal.savedAmount;
    const goalDeltas = deltasByGoal.get(goal.id!);
    if (goalDeltas) {
      for (const [key, delta] of goalDeltas) {
        if (key > currentMonthKey) {
          balance = currencyUtil.parse(balance, currency).subtract(delta).value;
        }
      }
    }
    running.set(goal.id!, balance);
  }

  const points: GoalGrowthPoint[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i < months; i += 1) {
    const anchor = i === 0
      ? now
      : new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const point: GoalGrowthPoint = { month: format(anchor, 'MMM') };
    for (const goal of goals) {
      point[goal.id!] = running.get(goal.id!) ?? 0;
    }
    points.push(point);

    const cursorKey = monthKeyOf(cursor);
    for (const goal of goals) {
      const monthDelta = deltasByGoal.get(goal.id!)?.get(cursorKey) ?? 0;
      const current = running.get(goal.id!) ?? 0;
      running.set(goal.id!, currencyUtil.parse(current, currency).subtract(monthDelta).value);
    }
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return { data: points.reverse(), series };
};

export default computeReportsGoalGrowth;
