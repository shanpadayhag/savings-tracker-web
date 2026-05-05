import Currency from '@/enums/currency';
import GoalStatus from '@/features/goals/enums/goal-status';
import documentDBUtil from '@/utils/document-db-util';

export type AllocationSlice = {
  name: string;
  amount: number;
  kind: 'goal' | 'wallet';
};

type WalletRow = {
  name: string;
  currency: Currency;
  currentAmount: number;
};

type GoalRow = {
  name: string;
  currency: Currency;
  savedAmount: number;
  status: GoalStatus;
};

const sortByAmountDescending = <T extends { amount: number; }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => b.amount - a.amount);

const goalSlicesFor = (goals: GoalRow[], currency: Currency): AllocationSlice[] => {
  const matches = goals
    .filter(goal => goal.currency === currency)
    .filter(goal => goal.status === GoalStatus.Active)
    .filter(goal => goal.savedAmount > 0)
    .map(goal => ({ name: goal.name, amount: goal.savedAmount, kind: 'goal' as const }));
  return sortByAmountDescending(matches);
};

const walletSlicesFor = (wallets: WalletRow[], currency: Currency): AllocationSlice[] => {
  const matches = wallets
    .filter(wallet => wallet.currency === currency)
    .filter(wallet => wallet.currentAmount > 0)
    .map(wallet => ({ name: wallet.name, amount: wallet.currentAmount, kind: 'wallet' as const }));
  return sortByAmountDescending(matches);
};

const computeAllocationBreakdown = async (currency: Currency): Promise<AllocationSlice[]> => {
  const [wallets, goals] = await Promise.all([
    documentDBUtil.wallet_list.toArray(),
    documentDBUtil.goal_list.toArray(),
  ]);

  return [
    ...goalSlicesFor(goals, currency),
    ...walletSlicesFor(wallets, currency),
  ];
};

export default computeAllocationBreakdown;
