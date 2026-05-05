import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeTopGoals from '@/features/dashboard/api/compute-top-goals';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // 2026-05-15

const seedGoal = async (overrides: {
  id: string;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  status?: GoalStatus;
  name?: string;
}) => {
  const targetAmount = overrides.targetAmount ?? 10000;
  const savedAmount = overrides.savedAmount ?? 0;
  await documentDBFake.goal_list.add({
    id: overrides.id,
    versionID: `${overrides.id}-v1`,
    name: overrides.name ?? `Goal ${overrides.id}`,
    targetAmount,
    savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status: overrides.status ?? GoalStatus.Active,
    currency: overrides.currency ?? Currency.USD,
    createdAt: new Date(2025, 11, 1),
    updatedAt: FIXED_NOW,
  });
};

const seedAllocateToGoal = async (id: string, goalID: string, currency: Currency, amount: number, createdAt: Date) => {
  await documentDBFake.transaction_list.add({
    id,
    type: TransactionType.Allocate,
    notes: null,
    entries: [
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: null, currency, direction: TransactionDirection.From, amount },
      { type: TransactionSourceType.Goal, sourceID: goalID, name: null, currency, direction: TransactionDirection.To, amount },
    ],
    createdAt, updatedAt: createdAt,
  });
};

describe('computeTopGoals', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns active goals in the active currency, sorted by progress descending', async () => {
    await seedGoal({ id: 'emergency', currency: Currency.USD, targetAmount: 10000, savedAmount: 8200 });
    await seedGoal({ id: 'house', currency: Currency.USD, targetAmount: 25000, savedAmount: 6420 });
    await seedGoal({ id: 'travel', currency: Currency.USD, targetAmount: 5000, savedAmount: 2410 });
    await seedGoal({ id: 'peso-trip', currency: Currency.Peso, targetAmount: 50000, savedAmount: 40000 });

    const goals = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goals.map(goal => goal.id)).toEqual(['emergency', 'travel', 'house']);
  });

  it('caps results to the requested limit', async () => {
    for (let i = 0; i < 6; i += 1) {
      await seedGoal({ id: `g-${i}`, targetAmount: 1000, savedAmount: 100 + i * 10 });
    }

    const goals = await computeTopGoals(Currency.USD, { now: FIXED_NOW, limit: 2 });

    expect(goals).toHaveLength(2);
  });

  it('excludes completed and archived goals', async () => {
    await seedGoal({ id: 'active', targetAmount: 1000, savedAmount: 500 });
    await seedGoal({ id: 'completed', targetAmount: 1000, savedAmount: 1000, status: GoalStatus.Completed });
    await seedGoal({ id: 'archived', targetAmount: 1000, savedAmount: 1000, status: GoalStatus.Archived });

    const goals = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goals.map(goal => goal.id)).toEqual(['active']);
  });

  it('returns 0 ETA for fully-funded goals', async () => {
    await seedGoal({ id: 'funded', targetAmount: 1000, savedAmount: 1000 });

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBe(0);
  });

  it('returns null ETA when there is no positive inflow in the lookback window', async () => {
    await seedGoal({ id: 'idle', targetAmount: 1000, savedAmount: 200 });

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBeNull();
  });

  it('forecasts ETA from the average monthly inflow over the last 6 months', async () => {
    // Goal needs 800 more. Inflow in lookback = 600 over 6 months → avg 100/mo.
    // ETA = ceil(800/100) = 8 months.
    await seedGoal({ id: 'emergency', targetAmount: 1000, savedAmount: 200 });
    await seedAllocateToGoal('a1', 'emergency', Currency.USD, 200, new Date(2026, 1, 5));
    await seedAllocateToGoal('a2', 'emergency', Currency.USD, 200, new Date(2026, 2, 5));
    await seedAllocateToGoal('a3', 'emergency', Currency.USD, 200, new Date(2026, 3, 5));

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBe(8);
  });

  it('subtracts goal outflows (transfers, spends) when forecasting ETA', async () => {
    // Inflow 600, outflow 300 in the window → net 300/6 = 50/mo. Remaining 800.
    // ETA = ceil(800/50) = 16 months.
    await seedGoal({ id: 'emergency', targetAmount: 1000, savedAmount: 200 });
    await seedAllocateToGoal('a1', 'emergency', Currency.USD, 600, new Date(2026, 2, 5));
    await documentDBFake.transaction_list.add({
      id: 's1',
      type: TransactionType.Spend,
      notes: null,
      entries: [
        { type: TransactionSourceType.Goal, sourceID: 'emergency', name: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 300 },
        { type: TransactionSourceType.External, sourceID: null, name: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 300 },
      ],
      createdAt: new Date(2026, 3, 5),
      updatedAt: new Date(2026, 3, 5),
    });

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBe(16);
  });

  it('caps ETA at 240 months for very slow funding', async () => {
    // Tiny inflow over 6 months → cap kicks in.
    await seedGoal({ id: 'huge', targetAmount: 1000000, savedAmount: 0 });
    await seedAllocateToGoal('a1', 'huge', Currency.USD, 6, new Date(2026, 3, 1));

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBe(240);
  });

  it('ignores funding contributions outside the lookback window', async () => {
    // Inflow happened 8 months ago — outside the 6-month window.
    await seedGoal({ id: 'emergency', targetAmount: 1000, savedAmount: 200 });
    await seedAllocateToGoal('a1', 'emergency', Currency.USD, 600, new Date(2025, 8, 5));

    const [goal] = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goal.etaMonths).toBeNull();
  });

  it('returns an empty list when there are no eligible goals', async () => {
    await seedGoal({ id: 'peso', currency: Currency.Peso, targetAmount: 1000, savedAmount: 200 });

    const goals = await computeTopGoals(Currency.USD, { now: FIXED_NOW });

    expect(goals).toEqual([]);
  });
});
