import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import getCachedGoals from '@/features/goals/api/get-cached-goals';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedListItem = async (overrides: {
  id: string;
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  status?: GoalStatus;
  statusChangedAt?: Date;
  categoryID?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) => {
  const targetAmount = overrides.targetAmount ?? 1000;
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
    statusChangedAt: overrides.statusChangedAt,
    currency: Currency.USD,
    categoryID: overrides.categoryID,
    createdAt: overrides.createdAt ?? new Date('2026-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2026-02-01'),
  });
};

describe('getCachedGoals', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns updatedAt distinct from createdAt (regression: previously aliased)', async () => {
    // Regression: the mapper had `updatedAt: goalListItem.createdAt` — a typo
    // that erased every status-change/edit timestamp downstream and would
    // make any "recently updated" sort silently group rows by creation date.
    const createdAt = new Date('2026-01-01');
    const updatedAt = new Date('2026-04-15');
    await seedListItem({ id: 'g1', createdAt, updatedAt });

    const [goal] = await getCachedGoals();

    expect(goal.createdAt).toEqual(createdAt);
    expect(goal.updatedAt).toEqual(updatedAt);
  });

  it('exposes statusChangedAt for downstream consumers', async () => {
    // Regression: the mapper omitted statusChangedAt entirely, hiding the
    // most recent transition timestamp from any UI that wanted to show it
    // (e.g. "Completed Apr 12").
    const statusChangedAt = new Date('2026-04-10');
    await seedListItem({ id: 'g1', status: GoalStatus.Completed, statusChangedAt });

    const [goal] = await getCachedGoals();

    expect(goal.statusChangedAt).toEqual(statusChangedAt);
  });

  it('preserves categoryID on the mapped row', async () => {
    await seedListItem({ id: 'g1', categoryID: 'travel' });

    const [goal] = await getCachedGoals();

    expect(goal.categoryID).toBe('travel');
  });

  it('returns an empty list when the cache is empty', async () => {
    const goals = await getCachedGoals();
    expect(goals).toEqual([]);
  });

  it('returns currency-typed amount fields parseable to numbers', async () => {
    await seedListItem({ id: 'g1', targetAmount: 1000, savedAmount: 250 });

    const [goal] = await getCachedGoals();

    expect(goal.targetAmount.value).toBe(1000);
    expect(goal.savedAmount.value).toBe(250);
    expect(goal.remainingAmount.value).toBe(750);
  });
});
