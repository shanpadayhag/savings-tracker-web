import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import completeGoal from '@/features/goals/api/complete-goal';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedGoal = async (overrides: {
  id: string;
  status?: GoalStatus;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  name?: string;
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
    currency: overrides.currency ?? Currency.USD,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  await appDBFake.goals.add({
    id: overrides.id,
    status: overrides.status ?? GoalStatus.Active,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
};

describe('completeGoal', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('drains the saved balance via a Spend transaction and zeros the goal', async () => {
    await seedGoal({ id: 'emergency', targetAmount: 1000, savedAmount: 800 });

    await completeGoal({ goalID: 'emergency' });

    const goal = await documentDBFake.goal_list.get('emergency');
    expect(goal?.status).toBe(GoalStatus.Completed);
    expect(goal?.savedAmount).toBe(0);
    expect(goal?.savedPercent).toBe(0);
    expect(goal?.remainingAmount).toBe(1000);

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Spend);
    expect(transactions[0].notes).toBe('Goal completed');

    const entries = appDBFake.transaction_entries.list();
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'emergency',
      amount: 800,
      currency: Currency.USD,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      sourceID: null,
      amount: 800,
      currency: Currency.USD,
    });
  });

  it('tags the spend transaction with the seeded "Others" category', async () => {
    await seedGoal({ id: 'emergency', targetAmount: 500, savedAmount: 500 });

    await completeGoal({ goalID: 'emergency' });

    const seededCategory = appDBFake.categories.list()
      .find(category => category.name === 'Others');
    expect(seededCategory).toBeDefined();

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].categoryID).toBe(seededCategory?.id);

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.categoryID).toBe(seededCategory?.id);
    expect(transactionListRow.categoryName).toBe('Others');
  });

  it('writes one transaction list row with both entries linked to the same id', async () => {
    await seedGoal({ id: 'emergency', targetAmount: 1000, savedAmount: 250 });

    await completeGoal({ goalID: 'emergency' });

    const transactions = appDBFake.transactions.list();
    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.id).toBe(transactions[0].id);
    expect(transactionListRow.entries).toHaveLength(2);
    const entries = appDBFake.transaction_entries.list();
    expect(entries.every(entry => entry.transactionID === transactions[0].id)).toBe(true);
  });

  it('only flips status when the goal has no saved balance', async () => {
    await seedGoal({ id: 'empty', targetAmount: 1000, savedAmount: 0 });

    await completeGoal({ goalID: 'empty' });

    const goal = await documentDBFake.goal_list.get('empty');
    expect(goal?.status).toBe(GoalStatus.Completed);
    expect(goal?.savedAmount).toBe(0);

    expect(appDBFake.transactions.list()).toHaveLength(0);
    expect(appDBFake.transaction_entries.list()).toHaveLength(0);
    expect(documentDBFake.transaction_list.list()).toHaveLength(0);
  });

  it('rejects when the goal does not exist', async () => {
    await expect(completeGoal({ goalID: 'missing' })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the goal is already completed', async () => {
    await seedGoal({ id: 'done', status: GoalStatus.Completed, savedAmount: 0 });

    await expect(completeGoal({ goalID: 'done' })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the goal is archived', async () => {
    await seedGoal({ id: 'old', status: GoalStatus.Archived, savedAmount: 0 });

    await expect(completeGoal({ goalID: 'old' })).rejects.toBeInstanceOf(AppError);
  });
});
