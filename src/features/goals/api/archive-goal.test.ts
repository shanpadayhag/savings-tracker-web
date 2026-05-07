import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import archiveGoal from '@/features/goals/api/archive-goal';
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
}) => {
  const targetAmount = overrides.targetAmount ?? 1000;
  const savedAmount = overrides.savedAmount ?? 0;
  await documentDBFake.goal_list.add({
    id: overrides.id,
    versionID: `${overrides.id}-v1`,
    name: `Goal ${overrides.id}`,
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

const seedWallet = async (overrides: {
  id: string;
  currency?: Currency;
  currentAmount?: number;
}) => {
  await documentDBFake.wallet_list.add({
    id: overrides.id,
    name: `Wallet ${overrides.id}`,
    currency: overrides.currency ?? Currency.USD,
    currentAmount: overrides.currentAmount ?? 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
};

describe('archiveGoal', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('moves the saved balance to the chosen wallet and flips status to Archived', async () => {
    await seedGoal({ id: 'old-goal', savedAmount: 300 });
    await seedWallet({ id: 'savings', currentAmount: 100 });

    await archiveGoal({ goalID: 'old-goal', walletID: 'savings' });

    const goal = await documentDBFake.goal_list.get('old-goal');
    const wallet = await documentDBFake.wallet_list.get('savings');
    expect(goal?.status).toBe(GoalStatus.Archived);
    expect(goal?.savedAmount).toBe(0);
    expect(wallet?.currentAmount).toBe(400);
  });

  it('writes a Deallocate transaction with both entries', async () => {
    await seedGoal({ id: 'old-goal', savedAmount: 200 });
    await seedWallet({ id: 'savings' });

    await archiveGoal({ goalID: 'old-goal', walletID: 'savings' });

    const transactions = appDBFake.transactions.list();
    const entries = appDBFake.transaction_entries.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Deallocate);
    expect(entries).toHaveLength(2);
    expect(entries.map(entry => entry.direction).sort()).toEqual([
      TransactionDirection.From, TransactionDirection.To,
    ]);
    expect(entries.find(entry => entry.sourceType === TransactionSourceType.Goal)?.sourceID).toBe('old-goal');
    expect(entries.find(entry => entry.sourceType === TransactionSourceType.Wallet)?.sourceID).toBe('savings');
  });

  it('only flips status when the goal has no saved balance', async () => {
    await seedGoal({ id: 'empty-goal', savedAmount: 0 });
    await seedWallet({ id: 'savings' });

    await archiveGoal({ goalID: 'empty-goal', walletID: 'savings' });

    const goal = await documentDBFake.goal_list.get('empty-goal');
    expect(goal?.status).toBe(GoalStatus.Archived);
    expect(appDBFake.transactions.list()).toHaveLength(0);
  });

  it('writes a defined createdAt and reversedCreatedAt when params.createdAt is omitted', async () => {
    // Regression: previously params.createdAt was passed straight through, so
    // omitting it (the typical UI path) wrote `undefined` to createdAt and
    // reversedCreatedAt, breaking the reverse-chronological transaction list
    // index and the reconciler's chronological replay.
    await seedGoal({ id: 'fresh-archive', savedAmount: 50 });
    await seedWallet({ id: 'savings' });

    const before = Date.now();
    await archiveGoal({ goalID: 'fresh-archive', walletID: 'savings' });
    const after = Date.now();

    const [listRow] = documentDBFake.transaction_list.list();
    expect(listRow.createdAt).toBeInstanceOf(Date);
    const ts = listRow.createdAt!.getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
    expect(listRow.reversedCreatedAt).toBe(ts * -1);

    const goal = await documentDBFake.goal_list.get('fresh-archive');
    expect(goal?.statusChangedAt).toBeInstanceOf(Date);
  });

  it('rejects when the goal is missing', async () => {
    await seedWallet({ id: 'savings' });
    await expect(archiveGoal({ goalID: 'missing', walletID: 'savings' })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the goal is already archived', async () => {
    await seedGoal({ id: 'old-goal', status: GoalStatus.Archived });
    await seedWallet({ id: 'savings' });
    await expect(archiveGoal({ goalID: 'old-goal', walletID: 'savings' })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when no wallet is provided', async () => {
    await seedGoal({ id: 'old-goal' });
    await expect(archiveGoal({ goalID: 'old-goal' })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the wallet currency does not match the goal currency', async () => {
    await seedGoal({ id: 'usd-goal', currency: Currency.USD });
    await seedWallet({ id: 'peso-wallet', currency: Currency.Peso });
    await expect(archiveGoal({ goalID: 'usd-goal', walletID: 'peso-wallet' })).rejects.toBeInstanceOf(AppError);
  });
});
