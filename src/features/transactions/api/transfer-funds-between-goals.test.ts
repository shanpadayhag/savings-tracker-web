import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import transferFundsBetweenGoals from '@/features/transactions/api/transfer-funds-between-goals';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

type SeedGoalOverrides = {
  id: string;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  name?: string;
};

const seedGoal = async (overrides: SeedGoalOverrides) => {
  const targetAmount = overrides.targetAmount ?? 1000;
  const savedAmount = overrides.savedAmount ?? 0;
  const goal = {
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
  };
  await documentDBFake.goal_list.add(goal);
  return goal;
};

describe('transferFundsBetweenGoals', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('moves funds and recomputes savedPercent + remainingAmount on both goals', async () => {
    await seedGoal({ id: 'source', targetAmount: 1000, savedAmount: 600 });
    await seedGoal({ id: 'destination', targetAmount: 2000, savedAmount: 500 });

    await transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '200',
      notes: '',
    });

    const source = await documentDBFake.goal_list.get('source');
    const destination = await documentDBFake.goal_list.get('destination');

    expect(source?.savedAmount).toBe(400);
    expect(source?.remainingAmount).toBe(600);
    expect(source?.savedPercent).toBe(40);

    expect(destination?.savedAmount).toBe(700);
    expect(destination?.remainingAmount).toBe(1300);
    expect(destination?.savedPercent).toBe(35);
  });

  it('emits a Goal/From and Goal/To entry pair with the same amount', async () => {
    await seedGoal({ id: 'source', targetAmount: 500, savedAmount: 300 });
    await seedGoal({ id: 'destination', targetAmount: 500, savedAmount: 0 });

    await transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '125.50',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'source',
      amount: 125.50,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'destination',
      amount: 125.50,
    });
  });

  it('writes a single Transfer transaction with trimmed notes', async () => {
    await seedGoal({ id: 'source', targetAmount: 500, savedAmount: 200 });
    await seedGoal({ id: 'destination', targetAmount: 500, savedAmount: 0 });

    await transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '50',
      notes: '  rebalance  ',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Transfer);
    expect(transactions[0].notes).toBe('rebalance');
  });

  it('rejects when source and destination are the same', async () => {
    await seedGoal({ id: 'source', targetAmount: 500, savedAmount: 200 });

    await expect(transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'source',
      amount: '50',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when goal currencies differ', async () => {
    await seedGoal({ id: 'source', currency: Currency.USD, targetAmount: 500, savedAmount: 200 });
    await seedGoal({ id: 'destination', currency: Currency.Peso, targetAmount: 500, savedAmount: 0 });

    await expect(transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '50',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when source goal lacks the funds', async () => {
    await seedGoal({ id: 'source', targetAmount: 500, savedAmount: 30 });
    await seedGoal({ id: 'destination', targetAmount: 500, savedAmount: 0 });

    await expect(transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '50',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const source = await documentDBFake.goal_list.get('source');
    const destination = await documentDBFake.goal_list.get('destination');
    expect(source?.savedAmount).toBe(30);
    expect(destination?.savedAmount).toBe(0);
  });

  it('rejects a non-positive amount', async () => {
    await seedGoal({ id: 'source', targetAmount: 500, savedAmount: 200 });
    await seedGoal({ id: 'destination', targetAmount: 500, savedAmount: 0 });

    await expect(transferFundsBetweenGoals({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });
});
