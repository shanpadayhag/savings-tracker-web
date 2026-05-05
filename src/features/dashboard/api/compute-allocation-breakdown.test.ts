import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeAllocationBreakdown from '@/features/dashboard/api/compute-allocation-breakdown';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (id: string, name: string, currency: Currency, currentAmount: number) => {
  await documentDBFake.wallet_list.add({
    id, name, currency, currentAmount,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  });
};

const seedGoal = async (overrides: {
  id: string;
  name: string;
  currency: Currency;
  savedAmount: number;
  targetAmount?: number;
  status?: GoalStatus;
}) => {
  const targetAmount = overrides.targetAmount ?? 10000;
  await documentDBFake.goal_list.add({
    id: overrides.id, versionID: `${overrides.id}-v1`, name: overrides.name,
    targetAmount, savedAmount: overrides.savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (overrides.savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - overrides.savedAmount,
    status: overrides.status ?? GoalStatus.Active,
    currency: overrides.currency,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  });
};

describe('computeAllocationBreakdown', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns goals first then wallets, each group sorted by amount descending', async () => {
    await seedWallet('checking', 'Checking', Currency.USD, 4120);
    await seedWallet('savings', 'Savings Account', Currency.USD, 2120);
    await seedGoal({ id: 'emergency', name: 'Emergency Fund', currency: Currency.USD, savedAmount: 8200 });
    await seedGoal({ id: 'house', name: 'House Down Payment', currency: Currency.USD, savedAmount: 6420 });
    await seedGoal({ id: 'travel', name: 'Travel Fund', currency: Currency.USD, savedAmount: 2410 });

    const slices = await computeAllocationBreakdown(Currency.USD);

    expect(slices.map(slice => ({ name: slice.name, kind: slice.kind, amount: slice.amount }))).toEqual([
      { name: 'Emergency Fund', kind: 'goal', amount: 8200 },
      { name: 'House Down Payment', kind: 'goal', amount: 6420 },
      { name: 'Travel Fund', kind: 'goal', amount: 2410 },
      { name: 'Checking', kind: 'wallet', amount: 4120 },
      { name: 'Savings Account', kind: 'wallet', amount: 2120 },
    ]);
  });

  it('only includes records in the active currency', async () => {
    await seedWallet('usd', 'USD Wallet', Currency.USD, 100);
    await seedWallet('peso', 'Peso Wallet', Currency.Peso, 50000);
    await seedGoal({ id: 'usd-goal', name: 'USD Goal', currency: Currency.USD, savedAmount: 200 });
    await seedGoal({ id: 'peso-goal', name: 'Peso Goal', currency: Currency.Peso, savedAmount: 30000 });

    const usdSlices = await computeAllocationBreakdown(Currency.USD);

    expect(usdSlices.map(slice => slice.name)).toEqual(['USD Goal', 'USD Wallet']);
  });

  it('skips goals and wallets with zero amount so the donut has no empty wedges', async () => {
    await seedWallet('zero', 'Empty Wallet', Currency.USD, 0);
    await seedWallet('funded', 'Funded Wallet', Currency.USD, 500);
    await seedGoal({ id: 'idle', name: 'Idle Goal', currency: Currency.USD, savedAmount: 0 });
    await seedGoal({ id: 'progress', name: 'Progressing Goal', currency: Currency.USD, savedAmount: 200 });

    const slices = await computeAllocationBreakdown(Currency.USD);

    expect(slices.map(slice => slice.name)).toEqual(['Progressing Goal', 'Funded Wallet']);
  });

  it('skips completed and archived goals even if they still hold a balance', async () => {
    await seedGoal({ id: 'active', name: 'Active', currency: Currency.USD, savedAmount: 100 });
    await seedGoal({ id: 'completed', name: 'Completed', currency: Currency.USD, savedAmount: 999, status: GoalStatus.Completed });
    await seedGoal({ id: 'archived', name: 'Archived', currency: Currency.USD, savedAmount: 999, status: GoalStatus.Archived });

    const slices = await computeAllocationBreakdown(Currency.USD);

    expect(slices.map(slice => slice.name)).toEqual(['Active']);
  });

  it('returns an empty list when nothing is allocated in the currency', async () => {
    await seedWallet('peso', 'Peso Wallet', Currency.Peso, 5000);

    const slices = await computeAllocationBreakdown(Currency.USD);

    expect(slices).toEqual([]);
  });
});
