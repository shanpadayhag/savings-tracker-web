import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (
  id: string,
  currency: Currency,
  currentAmount: number,
) => {
  const wallet = {
    id,
    name: `Wallet ${id}`,
    currency,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: 'null' as const,
  };
  await appDBFake.wallets.add(wallet);
  await documentDBFake.wallet_list.add({
    id,
    name: wallet.name,
    currency,
    currentAmount,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  });
  return wallet;
};

const seedGoal = async (overrides: {
  id: string;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  name?: string;
}) => {
  const targetAmount = overrides.targetAmount ?? 1000;
  const savedAmount = overrides.savedAmount ?? 0;
  const currency = overrides.currency ?? Currency.USD;
  const name = overrides.name ?? `Goal ${overrides.id}`;
  const versionID = `${overrides.id}-v1`;

  await appDBFake.goals.add({
    id: overrides.id,
    status: GoalStatus.Active,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  await appDBFake.goal_versions.add({
    id: versionID,
    goalID: overrides.id,
    name,
    targetAmount,
    currency,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  await documentDBFake.goal_list.add({
    id: overrides.id,
    versionID,
    name,
    targetAmount,
    savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status: GoalStatus.Active,
    currency,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
};

describe('allocateFundsToGoal', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('debits the wallet and credits the goal, recomputing percent and remaining', async () => {
    await seedWallet('wallet', Currency.USD, 500);
    await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 200 });

    await allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '300',
      notes: '',
    });

    const wallet = await documentDBFake.wallet_list.get('wallet');
    const goal = await documentDBFake.goal_list.get('goal');
    expect(wallet?.currentAmount).toBe(200);
    expect(goal?.savedAmount).toBe(500);
    expect(goal?.remainingAmount).toBe(500);
    expect(goal?.savedPercent).toBe(50);
  });

  it('caps remainingAmount and savedPercent correctly when goal is overfunded', async () => {
    await seedWallet('wallet', Currency.USD, 1500);
    await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 800 });

    await allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '500',
      notes: '',
    });

    const goal = await documentDBFake.goal_list.get('goal');
    expect(goal?.savedAmount).toBe(1300);
    expect(goal?.remainingAmount).toBe(-300);
    expect(goal?.savedPercent).toBe(130);
  });

  it('writes a Wallet/From and Goal/To entry pair with matching amount', async () => {
    await seedWallet('wallet', Currency.USD, 200);
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 0 });

    await allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '40',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Wallet,
      sourceID: 'wallet',
      amount: 40,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'goal',
      amount: 40,
    });
  });

  it('writes one Allocate transaction header', async () => {
    await seedWallet('wallet', Currency.USD, 200);
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 0 });

    await allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '50',
      notes: 'monthly contribution',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Allocate);
  });

  it('rejects when wallet currency mismatches goal currency', async () => {
    await seedWallet('wallet', Currency.USD, 1000);
    await seedGoal({ id: 'goal', currency: Currency.Peso, targetAmount: 1000, savedAmount: 0 });

    await expect(allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '100',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when wallet has insufficient funds', async () => {
    await seedWallet('wallet', Currency.USD, 50);
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 0 });

    await expect(allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '100',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet');
    const goal = await documentDBFake.goal_list.get('goal');
    expect(wallet?.currentAmount).toBe(50);
    expect(goal?.savedAmount).toBe(0);
  });

  it('rejects a non-positive amount', async () => {
    await seedWallet('wallet', Currency.USD, 500);
    await seedGoal({ id: 'goal', targetAmount: 500, savedAmount: 0 });

    await expect(allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    await expect(allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '-10',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('emits 0% savedPercent for a zero-target goal instead of NaN/Infinity', async () => {
    // Regression: previously dividing savedAmount by a 0 targetAmount would
    // produce Infinity (or NaN) on the destination goal's savedPercent.
    // The reconciler guards against this; allocators now match.
    await seedWallet('wallet', Currency.USD, 500);
    await seedGoal({ id: 'goal', targetAmount: 0, savedAmount: 0 });

    await allocateFundsToGoal({
      sourceID: 'wallet',
      destinationID: 'goal',
      amount: '100',
      notes: '',
    });

    const goal = await documentDBFake.goal_list.get('goal');
    expect(goal?.savedPercent).toBe(0);
    expect(Number.isFinite(goal?.savedPercent ?? NaN)).toBe(true);
  });
});
