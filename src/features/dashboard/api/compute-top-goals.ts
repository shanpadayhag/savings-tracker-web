import Currency from '@/enums/currency';
import GoalStatus from '@/features/goals/enums/goal-status';
import isCountedTransaction from '@/features/transactions/api/is-counted-transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type TopGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  currency: Currency;
  /** Forecasted months remaining at the goal's recent funding pace.
   * `null` when there's no positive inflow in the lookback window — the UI
   * shows a placeholder instead of a misleading number. */
  etaMonths: number | null;
};

const DEFAULT_TOP_N = 4;
const ETA_LOOKBACK_MONTHS = 6;
const ETA_CAP_MONTHS = 240; // 20 years — keep the label sane for tiny inflows.

type TransactionEntry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionRow = {
  entries: TransactionEntry[];
  createdAt?: Date;
};

type GoalRow = {
  id: string;
  name: string;
  currency: Currency;
  targetAmount: number;
  savedAmount: number;
  status: GoalStatus;
};

const startOfLookbackAt = (anchor: Date): Date =>
  new Date(anchor.getFullYear(), anchor.getMonth() - ETA_LOOKBACK_MONTHS, 1);

const sumNetInflow = (
  transactions: TransactionRow[],
  goalID: string,
  currency: Currency,
  startInclusive: Date,
): number => {
  let net = 0;
  for (const transaction of transactions) {
    if (!transaction.createdAt || transaction.createdAt < startInclusive) continue;
    for (const entry of transaction.entries) {
      if (entry.type !== TransactionSourceType.Goal) continue;
      if (entry.sourceID !== goalID) continue;
      if (entry.currency !== currency) continue;
      net += entry.direction === TransactionDirection.To ? entry.amount : -entry.amount;
    }
  }
  return currencyUtil.parse(net, currency).value;
};

const computeEtaMonthsFor = (goal: GoalRow, transactions: TransactionRow[], now: Date): number | null => {
  const remaining = currencyUtil.parse(goal.targetAmount, goal.currency)
    .subtract(goal.savedAmount).value;
  if (remaining <= 0) return 0;

  const netInflow = sumNetInflow(transactions, goal.id, goal.currency, startOfLookbackAt(now));
  if (netInflow <= 0) return null;

  const averageMonthlyInflow = netInflow / ETA_LOOKBACK_MONTHS;
  return Math.min(ETA_CAP_MONTHS, Math.ceil(remaining / averageMonthlyInflow));
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
  /** Cap on the number of goals returned. Defaults to 4. */
  limit?: number;
};

const computeTopGoals = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<TopGoal[]> => {
  const now = options.now ?? new Date();
  const limit = Math.max(1, options.limit ?? DEFAULT_TOP_N);

  const [goals, allTransactions] = await Promise.all([
    documentDBUtil.goal_list.toArray(),
    documentDBUtil.transaction_list.toArray(),
  ]);
  const transactions = allTransactions.filter(isCountedTransaction);

  const candidates = goals
    .filter(goal => goal.currency === currency)
    .filter(goal => goal.status === GoalStatus.Active);

  const ranked = [...candidates].sort((a, b) => {
    const aProgress = a.targetAmount === 0 ? 0 : a.savedAmount / a.targetAmount;
    const bProgress = b.targetAmount === 0 ? 0 : b.savedAmount / b.targetAmount;
    return bProgress - aProgress;
  });

  return ranked.slice(0, limit).map(goal => ({
    id: goal.id,
    name: goal.name,
    target: goal.targetAmount,
    saved: goal.savedAmount,
    currency: goal.currency,
    etaMonths: computeEtaMonthsFor(goal, transactions, now),
  }));
};

export default computeTopGoals;
