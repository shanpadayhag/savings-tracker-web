import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import createGoal from '@/features/goals/api/create-goal';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedCategory = async (overrides: Partial<{ id: string; deletedAt: Date | 'null'; }> = {}) => {
  await appDBFake.categories.add({
    id: overrides.id ?? 'travel',
    name: 'Travel',
    color: '#22c55e',
    isSystem: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: overrides.deletedAt ?? 'null',
  });
};

describe('createGoal', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('seeds remainingAmount as the full targetAmount on initial create', async () => {
    // Regression: previously remainingAmount was hard-coded to 0, so a brand
    // new goal showed "$0 remaining / 0% to go" until a reconcile recomputed
    // it. Mirror what the reconciler computes (target - saved = target).
    await createGoal({ name: 'Travel Fund', targetAmount: '5000', currency: Currency.USD });

    const [goal] = documentDBFake.goal_list.list();
    expect(goal.targetAmount).toBe(5000);
    expect(goal.savedAmount).toBe(0);
    expect(goal.remainingAmount).toBe(5000);
    expect(goal.savedPercent).toBe(0);
  });

  it('writes parallel rows to appDB.goals, appDB.goal_versions, and documentDB.goal_list', async () => {
    await createGoal({ name: 'Emergency', targetAmount: '1000', currency: Currency.USD });

    expect(appDBFake.goals.list()).toHaveLength(1);
    expect(appDBFake.goal_versions.list()).toHaveLength(1);
    expect(documentDBFake.goal_list.list()).toHaveLength(1);

    const goal = appDBFake.goals.list()[0];
    const version = appDBFake.goal_versions.list()[0];
    const listRow = documentDBFake.goal_list.list()[0];
    expect(version.goalID).toBe(goal.id);
    expect(listRow.id).toBe(goal.id);
    expect(listRow.versionID).toBe(version.id);
  });

  it('seeds statusChangedAt to the createdAt instant on initial create', async () => {
    const createdAt = new Date('2026-05-15T10:00:00Z');
    await createGoal({ name: 'Travel', targetAmount: '500', currency: Currency.USD, createdAt });

    const [goal] = appDBFake.goals.list();
    const [listRow] = documentDBFake.goal_list.list();
    expect(goal.statusChangedAt).toEqual(createdAt);
    expect(listRow.statusChangedAt).toEqual(createdAt);
  });

  it('persists the chosen categoryID through to the goal_list row', async () => {
    await seedCategory({ id: 'travel' });

    await createGoal({ name: 'Vacation', targetAmount: '3000', currency: Currency.USD, categoryID: 'travel' });

    const [goal] = documentDBFake.goal_list.list();
    expect(goal.categoryID).toBe('travel');
  });

  it('defaults timestamps to a real Date when params.createdAt is omitted', async () => {
    // Regression: the entity types now require Date for createdAt/updatedAt,
    // but params still allow undefined. The writer must default once.
    const before = Date.now();
    await createGoal({ name: 'Goal', targetAmount: '100', currency: Currency.USD });
    const after = Date.now();

    const [goal] = appDBFake.goals.list();
    expect(goal.createdAt).toBeInstanceOf(Date);
    const ts = goal.createdAt.getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('rejects when no currency is provided', async () => {
    await expect(
      createGoal({ name: 'Goal', targetAmount: '100', currency: undefined })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the name is empty or whitespace', async () => {
    await expect(
      createGoal({ name: '   ', targetAmount: '100', currency: Currency.USD })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the target amount is zero or negative', async () => {
    await expect(
      createGoal({ name: 'Goal', targetAmount: '0', currency: Currency.USD })
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      createGoal({ name: 'Goal', targetAmount: '-5', currency: Currency.USD })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the chosen categoryID does not exist', async () => {
    await expect(
      createGoal({ name: 'Goal', targetAmount: '100', currency: Currency.USD, categoryID: 'missing' })
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the chosen category has been soft-deleted', async () => {
    await seedCategory({ id: 'archived', deletedAt: new Date('2025-12-01') });
    await expect(
      createGoal({ name: 'Goal', targetAmount: '100', currency: Currency.USD, categoryID: 'archived' })
    ).rejects.toBeInstanceOf(AppError);
  });
});
