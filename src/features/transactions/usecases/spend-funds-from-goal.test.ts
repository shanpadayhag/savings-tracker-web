import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import spendFundsFromGoal from '@/features/transactions/usecases/spend-funds-from-goal';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedGoal = async (overrides: {
  id: string;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  name?: string;
}) => {
  const targetAmount = overrides.targetAmount ?? 1000;
  const savedAmount = overrides.savedAmount ?? 500;
  await documentDBFake.goal_list.add({
    id: overrides.id,
    versionID: `${overrides.id}-v1`,
    name: overrides.name ?? `Goal ${overrides.id}`,
    targetAmount,
    savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status: GoalStatus.Active,
    currency: overrides.currency ?? Currency.USD,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
};

describe('spendFundsFromGoal', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('debits the goal and recomputes saved/percent/remaining', async () => {
    await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 800 });

    await spendFundsFromGoal({
      goalID: 'goal',
      amount: '300',
      notes: '',
    });

    const goal = await documentDBFake.goal_list.get('goal');
    expect(goal?.savedAmount).toBe(500);
    expect(goal?.savedPercent).toBe(50);
    expect(goal?.remainingAmount).toBe(500);
  });

  it('emits a Goal/From and External/To entry pair with the same amount', async () => {
    await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 600 });

    await spendFundsFromGoal({
      goalID: 'goal',
      amount: '125.50',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'goal',
      amount: 125.50,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      sourceID: null,
      amount: 125.50,
    });
  });

  it('writes a Spend transaction tagged with the seeded "Others" category when none is given', async () => {
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 300 });

    await spendFundsFromGoal({
      goalID: 'goal',
      amount: '40',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Spend);

    const seededCategory = appDBFake.categories.list()
      .find(category => category.name === 'Others');
    expect(seededCategory).toBeDefined();
    expect(transactions[0].categoryID).toBe(seededCategory?.id);

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.categoryID).toBe(seededCategory?.id);
    expect(transactionListRow.categoryName).toBe('Others');
  });

  it('uses a provided category ID when present', async () => {
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 300 });
    await appDBFake.categories.add({
      id: 'category-groceries',
      name: 'Groceries',
      color: '#00ff00',
      isSystem: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: 'null',
    });

    await spendFundsFromGoal({
      goalID: 'goal',
      amount: '40',
      categoryID: 'category-groceries',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].categoryID).toBe('category-groceries');

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.categoryName).toBe('Groceries');
    expect(transactionListRow.categoryColor).toBe('#00ff00');
  });

  it('falls back to "Others" when the provided category is soft-deleted', async () => {
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 300 });
    await appDBFake.categories.add({
      id: 'category-old',
      name: 'Old',
      color: '#ff0000',
      isSystem: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-02-01'),
    });

    await spendFundsFromGoal({
      goalID: 'goal',
      amount: '40',
      categoryID: 'category-old',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    const seededCategory = appDBFake.categories.list().find(category => category.name === 'Others');
    expect(transactions[0].categoryID).toBe(seededCategory?.id);
  });

  it('rejects when the goal does not exist', async () => {
    await expect(spendFundsFromGoal({
      goalID: 'missing',
      amount: '10',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a non-positive amount', async () => {
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 300 });

    await expect(spendFundsFromGoal({
      goalID: 'goal',
      amount: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the goal cannot cover the spend', async () => {
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 30 });

    await expect(spendFundsFromGoal({
      goalID: 'goal',
      amount: '100',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const goal = await documentDBFake.goal_list.get('goal');
    expect(goal?.savedAmount).toBe(30);
  });
});
