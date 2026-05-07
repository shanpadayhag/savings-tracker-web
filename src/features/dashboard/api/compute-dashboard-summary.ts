import Currency from '@/enums/currency';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

export type DashboardSummary = {
  netWorth: number;
  netWorthChangePercent: number;
  walletsBalance: number;
  walletsBalanceChangePercent: number;
  goalsBalance: number;
  goalsBalanceChangePercent: number;
  monthlySpend: number;
  monthlySpendChangePercent: number;
};

const startOfMonthAt = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const startOfPreviousMonthAt = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() - 1, 1);

const startOfNextMonthAt = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

const computePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

type WalletDelta = { inflow: number; outflow: number; };
type GoalDelta = { inflow: number; outflow: number; };

type TransactionListEntry = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type TransactionListRow = {
  type: TransactionType;
  entries: TransactionListEntry[];
  createdAt?: Date;
};

const sumWalletBalances = (wallets: { currency: Currency; currentAmount: number; }[], currency: Currency): number => {
  return wallets
    .filter(wallet => wallet.currency === currency)
    .reduce((total, wallet) => currencyUtil.parse(total, currency).add(wallet.currentAmount).value, 0);
};

const sumGoalSavedAmounts = (goals: { currency: Currency; savedAmount: number; }[], currency: Currency): number => {
  return goals
    .filter(goal => goal.currency === currency)
    .reduce((total, goal) => currencyUtil.parse(total, currency).add(goal.savedAmount).value, 0);
};

// Walks one transaction's entry array and accumulates wallet/goal deltas in
// the active currency. Fee entries (Internal/To) are attributed back to the
// transaction's source wallet so historical balances reconcile with the
// eagerly-maintained `currentAmount`.
const accumulateTransactionDeltas = (
  transaction: TransactionListRow,
  currency: Currency,
  walletDelta: WalletDelta,
  goalDelta: GoalDelta,
): void => {
  const sourceWalletEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From);

  for (const entry of transaction.entries) {
    if (entry.type === TransactionSourceType.Wallet && entry.currency === currency) {
      if (entry.direction === TransactionDirection.To) walletDelta.inflow += entry.amount;
      else walletDelta.outflow += entry.amount;
      continue;
    }

    if (entry.type === TransactionSourceType.Goal && entry.currency === currency) {
      if (entry.direction === TransactionDirection.To) goalDelta.inflow += entry.amount;
      else goalDelta.outflow += entry.amount;
      continue;
    }

    // A fee — Internal/To. Attribute it to the source wallet's outflow only
    // when the source wallet was in the active currency.
    if (entry.type === TransactionSourceType.Internal
      && entry.direction === TransactionDirection.To
      && sourceWalletEntry?.currency === currency) {
      walletDelta.outflow += entry.amount;
    }
  }
};

// Per-transaction outflow in the active currency. Mirrors the reports rule
// (compute-reports-summary.ts) so the dashboard's Monthly Spend KPI agrees
// with the reports' Total Expense for the same window:
//   - Spend's From entry where source is Goal or Wallet, in the active
//     currency.
//   - Internal/To fees on any transaction (typically Convert/Transfer)
//     attributed to a source Wallet/From in the active currency.
//   - The source side of cross-currency Convert transactions where the
//     source wallet is in the active currency (outflow leaving this ledger
//     for another currency's books).
const expenseFor = (transaction: TransactionListRow, currency: Currency): number => {
  let total = 0;

  if (transaction.type === TransactionType.Spend) {
    const fromEntry = transaction.entries.find(entry =>
      (entry.type === TransactionSourceType.Goal
        || entry.type === TransactionSourceType.Wallet)
      && entry.direction === TransactionDirection.From
      && entry.currency === currency);
    if (fromEntry) total += fromEntry.amount;
  }

  const feeEntry = transaction.entries.find(entry =>
    entry.type === TransactionSourceType.Internal
    && entry.direction === TransactionDirection.To
    && entry.currency === currency);
  if (feeEntry) {
    const sourceWallet = transaction.entries.find(entry =>
      entry.type === TransactionSourceType.Wallet
      && entry.direction === TransactionDirection.From);
    if (sourceWallet?.currency === currency) total += feeEntry.amount;
  }

  if (transaction.type === TransactionType.Convert) {
    const fromEntry = transaction.entries.find(entry =>
      entry.type === TransactionSourceType.Wallet
      && entry.direction === TransactionDirection.From
      && entry.currency === currency);
    const destWallet = transaction.entries.find(entry =>
      entry.type === TransactionSourceType.Wallet
      && entry.direction === TransactionDirection.To);
    if (fromEntry && destWallet?.currency !== currency) total += fromEntry.amount;
  }

  return total;
};

const sumSpendInRange = (
  transactions: TransactionListRow[],
  currency: Currency,
  startInclusive: Date,
  endExclusive: Date,
): number => {
  let total = 0;
  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < startInclusive) continue;
    if (transaction.createdAt >= endExclusive) continue;
    const amount = expenseFor(transaction, currency);
    if (amount > 0) total = currencyUtil.parse(total, currency).add(amount).value;
  }
  return total;
};

const collectMonthlyDeltas = (
  transactions: TransactionListRow[],
  currency: Currency,
  startOfMonth: Date,
): { walletDelta: WalletDelta; goalDelta: GoalDelta; } => {
  const walletDelta: WalletDelta = { inflow: 0, outflow: 0 };
  const goalDelta: GoalDelta = { inflow: 0, outflow: 0 };

  for (const transaction of transactions) {
    if (!transaction.createdAt) continue;
    if (transaction.createdAt < startOfMonth) continue;
    accumulateTransactionDeltas(transaction, currency, walletDelta, goalDelta);
  }

  return { walletDelta, goalDelta };
};

type ComputeOptions = {
  /** Anchor "now" — defaults to a fresh Date. Overridable for tests. */
  now?: Date;
};

const computeDashboardSummary = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<DashboardSummary> => {
  const now = options.now ?? new Date();
  const startOfThisMonth = startOfMonthAt(now);
  const startOfLastMonth = startOfPreviousMonthAt(now);

  const [wallets, goals, transactions] = await Promise.all([
    documentDBUtil.wallet_list.toArray(),
    documentDBUtil.goal_list.toArray(),
    documentDBUtil.transaction_list.toArray(),
  ]);

  const walletsBalance = sumWalletBalances(wallets, currency);
  const goalsBalance = sumGoalSavedAmounts(goals, currency);
  const netWorth = currencyUtil.parse(walletsBalance, currency).add(goalsBalance).value;

  const { walletDelta, goalDelta } = collectMonthlyDeltas(transactions, currency, startOfThisMonth);
  const walletNetThisMonth = walletDelta.inflow - walletDelta.outflow;
  const goalNetThisMonth = goalDelta.inflow - goalDelta.outflow;

  const walletsBalanceStartOfMonth = currencyUtil.parse(walletsBalance, currency)
    .subtract(walletNetThisMonth).value;
  const goalsBalanceStartOfMonth = currencyUtil.parse(goalsBalance, currency)
    .subtract(goalNetThisMonth).value;
  const netWorthStartOfMonth = currencyUtil.parse(walletsBalanceStartOfMonth, currency)
    .add(goalsBalanceStartOfMonth).value;

  // Both windows are full calendar months so the change% compares like-for-like.
  // Using `now` as the upper bound previously biased the metric (partial
  // current month vs full prior month) and excluded same-day-but-later
  // back-dated rows.
  const startOfNextMonth = startOfNextMonthAt(now);
  const monthlySpend = sumSpendInRange(transactions, currency, startOfThisMonth, startOfNextMonth);
  const previousMonthSpend = sumSpendInRange(transactions, currency, startOfLastMonth, startOfThisMonth);

  return {
    netWorth,
    netWorthChangePercent: computePercentChange(netWorth, netWorthStartOfMonth),
    walletsBalance,
    walletsBalanceChangePercent: computePercentChange(walletsBalance, walletsBalanceStartOfMonth),
    goalsBalance,
    goalsBalanceChangePercent: computePercentChange(goalsBalance, goalsBalanceStartOfMonth),
    monthlySpend,
    monthlySpendChangePercent: computePercentChange(monthlySpend, previousMonthSpend),
  };
};

export default computeDashboardSummary;
