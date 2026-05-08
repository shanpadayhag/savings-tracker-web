import Currency from '@/enums/currency';
import computeDashboardSummary, { DashboardSummary } from '@/features/dashboard/api/compute-dashboard-summary';
import GoalStatus from '@/features/goals/enums/goal-status';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type GoalRow = {
  id: string;
  name: string;
  currency: Currency;
  savedAmount: number;
  savedPercent: number;
  status: GoalStatus;
};

type TransactionEntry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  type: TransactionType;
  entries: TransactionEntry[];
  createdAt?: Date;
};

const SPEND_TREND_THRESHOLD_PERCENT = 0.5;
const PROGRESS_FLOOR_PERCENT = 5;

const startOfMonthAt = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const buildSpendTrendInsight = (summary: DashboardSummary): string | null => {
  if (summary.monthlySpend === 0) return null;
  const change = summary.monthlySpendChangePercent;
  if (Math.abs(change) < SPEND_TREND_THRESHOLD_PERCENT) return null;

  const magnitude = Math.abs(change).toFixed(1);
  if (change < 0) return `You're spending ${magnitude}% less than last month — keep going.`;
  return `Spending is up ${magnitude}% this month — watch your budget.`;
};

const buildTopGoalProgressInsight = (goals: GoalRow[], currency: Currency): string | null => {
  const inProgress = goals
    .filter(goal => goal.currency === currency)
    .filter(goal => goal.status === GoalStatus.Active)
    .filter(goal => goal.savedPercent > 0 && goal.savedPercent < 100);

  if (inProgress.length === 0) return null;

  const closest = inProgress.reduce((leader, candidate) =>
    candidate.savedPercent > leader.savedPercent ? candidate : leader);

  if (closest.savedPercent < PROGRESS_FLOOR_PERCENT) return null;

  return `${closest.name} is ${Math.round(closest.savedPercent)}% complete.`;
};

const buildLargestSpendGoalInsight = (
  goals: GoalRow[],
  transactions: TransactionRow[],
  currency: Currency,
  startOfThisMonth: Date,
): string | null => {
  const spendByGoalID = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== TransactionType.Spend) continue;
    if (!transaction.createdAt || transaction.createdAt < startOfThisMonth) continue;

    const goalEntry = transaction.entries.find(entry =>
      entry.type === TransactionSourceType.Goal
      && entry.direction === TransactionDirection.From
      && entry.currency === currency);
    if (!goalEntry?.sourceID) continue;

    const previous = spendByGoalID.get(goalEntry.sourceID) ?? 0;
    spendByGoalID.set(
      goalEntry.sourceID,
      currencyUtil.parse(previous, currency).add(goalEntry.amount).value,
    );
  }

  if (spendByGoalID.size === 0) return null;

  let topGoalID: string | null = null;
  let topAmount = 0;
  for (const [goalID, amount] of spendByGoalID) {
    if (amount > topAmount) {
      topGoalID = goalID;
      topAmount = amount;
    }
  }
  if (!topGoalID) return null;

  const goal = goals.find(candidate => candidate.id === topGoalID);
  if (!goal) return null;

  const formatted = currencyUtil.format(topAmount, currency);
  return `Your ${goal.name} saw the largest spend this month (-${formatted}).`;
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
  /** Reuse a summary already computed for the cards instead of recomputing. */
  summary?: DashboardSummary;
};

const computeDashboardInsights = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<string[]> => {
  const now = options.now ?? new Date();
  const startOfThisMonth = startOfMonthAt(now);

  const [goals, allTransactions, summary] = await Promise.all([
    documentDBUtil.goal_list.toArray(),
    documentDBUtil.transaction_list.toArray(),
    options.summary
      ? Promise.resolve(options.summary)
      : computeDashboardSummary(currency, { now }),
  ]);
  const transactions = allTransactions.filter(isCountedTransaction);

  const insights = [
    buildSpendTrendInsight(summary),
    buildTopGoalProgressInsight(goals, currency),
    buildLargestSpendGoalInsight(goals, transactions, currency, startOfThisMonth),
  ];

  return insights.filter((insight): insight is string => insight !== null);
};

export default computeDashboardInsights;
