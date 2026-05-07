import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import GoalStatus from '@/features/goals/enums/goal-status';
import computeReportsGoalGrowth from '@/features/reports/api/compute-reports-goal-growth';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15); // May 15, 2026

const seedGoal = async (
  id: string,
  name: string,
  currency: Currency,
  savedAmount: number,
  status: GoalStatus = GoalStatus.Active,
  createdAt: Date = new Date(2025, 0, 1),
) => {
  await documentDBFake.goal_list.add({
    id, versionID: `${id}-v1`, name,
    targetAmount: 10000, savedAmount,
    savedPercent: 0, remainingAmount: 0,
    status, currency,
    createdAt, updatedAt: createdAt,
  });
};

type EntryInput = {
  type: TransactionSourceType;
  sourceID?: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

const seedTransaction = async (
  id: string,
  type: TransactionType,
  createdAt: Date,
  entries: EntryInput[],
) => {
  await documentDBFake.transaction_list.add({
    id, type, notes: null,
    entries: entries.map(entry => ({
      type: entry.type,
      sourceID: entry.sourceID ?? null,
      name: null,
      currency: entry.currency,
      direction: entry.direction,
      amount: entry.amount,
    })),
    createdAt, updatedAt: createdAt,
  });
};

const seedAllocateToGoal = (
  id: string,
  createdAt: Date,
  goalID: string,
  currency: Currency,
  amount: number,
) => seedTransaction(id, TransactionType.Allocate, createdAt, [
  { type: TransactionSourceType.Wallet, sourceID: 'w', currency, direction: TransactionDirection.From, amount },
  { type: TransactionSourceType.Goal, sourceID: goalID, currency, direction: TransactionDirection.To, amount },
]);

describe('computeReportsGoalGrowth', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns no series and only month-keyed points when there are no active goals', async () => {
    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });
    expect(series).toEqual([]);
    expect(data.map(point => point.month)).toEqual(['Mar', 'Apr', 'May']);
    expect(data.every(point => Object.keys(point).length === 1)).toBe(true);
  });

  it('includes only Active goals in the active currency', async () => {
    await seedGoal('active-usd', 'USD Active', Currency.USD, 1000);
    await seedGoal('completed-usd', 'USD Done', Currency.USD, 0, GoalStatus.Completed);
    await seedGoal('archived-usd', 'USD Archived', Currency.USD, 0, GoalStatus.Archived);
    await seedGoal('active-peso', 'PHP Active', Currency.Peso, 5000);

    const { series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    expect(series.map(item => item.label)).toEqual(['USD Active']);
  });

  it('reports the current saved amount as the most-recent month value', async () => {
    await seedGoal('g1', 'Goal A', Currency.USD, 750);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '1m', { now: FIXED_NOW });

    expect(data).toHaveLength(1);
    expect(data[0][series[0].key]).toBe(750);
  });

  it('reconstructs the prior month value by subtracting that month\'s deltas', async () => {
    // Goal currently at 500. April allocation of 200 → it was 300 at end of March.
    await seedGoal('g1', 'Goal A', Currency.USD, 500);
    await seedAllocateToGoal('alloc-apr', new Date(2026, 3, 5), 'g1', Currency.USD, 200);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    const key = series[0].key;
    // Three points: Mar, Apr, May
    expect(data).toHaveLength(3);
    expect(data[0][key]).toBe(300); // March end (before April allocation)
    expect(data[1][key]).toBe(500); // April end
    expect(data[2][key]).toBe(500); // current
  });

  it('handles multiple goals independently', async () => {
    await seedGoal('a', 'Alpha', Currency.USD, 400, GoalStatus.Active, new Date(2025, 0, 1));
    await seedGoal('b', 'Beta', Currency.USD, 100, GoalStatus.Active, new Date(2025, 1, 1));
    await seedAllocateToGoal('alloc-a', new Date(2026, 4, 2), 'a', Currency.USD, 100);
    await seedAllocateToGoal('alloc-b', new Date(2026, 3, 2), 'b', Currency.USD, 50);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    const keyA = series.find(item => item.label === 'Alpha')!.key;
    const keyB = series.find(item => item.label === 'Beta')!.key;

    // Mar end: A=300 (no Mar deltas; Apr alloc is 100 to A in Apr; May alloc is 100 to A in May → current 400 → Apr end 300 → Mar end 300)
    // Actually re-derive: A current=400, May delta=+100 → Apr end=300; Apr delta=0 → Mar end=300.
    // B current=100, May delta=0 → Apr end=100; Apr delta=+50 → Mar end=50.
    expect(data[0][keyA]).toBe(300);
    expect(data[0][keyB]).toBe(50);
    // Current (May): A=400, B=100
    expect(data[data.length - 1][keyA]).toBe(400);
    expect(data[data.length - 1][keyB]).toBe(100);
  });

  it('treats spend transactions as negative goal deltas', async () => {
    // Goal currently at 200 after a 100 spend in April → it was 300 at end of March.
    await seedGoal('g1', 'Goal A', Currency.USD, 200);
    await seedTransaction('spend-apr', TransactionType.Spend, new Date(2026, 3, 10), [
      { type: TransactionSourceType.Goal, sourceID: 'g1', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    const key = series[0].key;
    expect(data[0][key]).toBe(300); // March end
    expect(data[1][key]).toBe(200); // April end (after the spend)
    expect(data[2][key]).toBe(200); // current
  });

  it('ignores transactions in other currencies when reconstructing balances', async () => {
    await seedGoal('g1', 'Goal A', Currency.USD, 500);
    await seedAllocateToGoal('alloc-peso', new Date(2026, 3, 5), 'g1', Currency.Peso, 9999);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    const key = series[0].key;
    // No USD movement, so prior months equal current.
    expect(data.every(point => point[key] === 500)).toBe(true);
  });

  it('reverses future-dated allocations off the live anchor (regression)', async () => {
    // Regression: goal.savedAmount is updated eagerly when a future-dated
    // transaction is logged, but the cursor only walks backward from the
    // current month — future-month deltas were never reversed and leaked
    // into every historical anchor. The fix pre-rolls future deltas off the
    // running balance before the walkback starts.
    await seedGoal('g1', 'Goal A', Currency.USD, 700);
    // 200 worth of allocations dated to NEXT month, already baked into the
    // 700 savedAmount above.
    await seedAllocateToGoal('future-1', new Date(2026, 5, 10), 'g1', Currency.USD, 200);

    const { data, series } = await computeReportsGoalGrowth(Currency.USD, '3m', { now: FIXED_NOW });

    const key = series[0].key;
    // The most-recent point ("now") should be the live present-day balance,
    // i.e. 700 minus the 200 dated to the future = 500.
    expect(data[data.length - 1][key]).toBe(500);
    // Every prior point should also be 500 — there's been no past activity.
    expect(data.every(point => point[key] === 500)).toBe(true);
  });
});
