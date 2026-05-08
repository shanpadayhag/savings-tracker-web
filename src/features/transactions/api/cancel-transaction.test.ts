import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import cancelTransaction from '@/features/transactions/api/cancel-transaction';
import convertFundsBetweenWallets from '@/features/transactions/api/convert-funds-between-wallets';
import transferFundsBetweenWallets from '@/features/transactions/api/transfer-funds-between-wallets';
import deallocateFundsFromWallet from '@/features/transactions/usecases/deallocate-funds-from-wallet';
import spendFundsFromGoal from '@/features/transactions/usecases/spend-funds-from-goal';
import spendFundsFromWallet from '@/features/transactions/usecases/spend-funds-from-wallet';
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
  status?: GoalStatus;
  currency?: Currency;
  targetAmount?: number;
  savedAmount?: number;
  name?: string;
}) => {
  const targetAmount = overrides.targetAmount ?? 1000;
  const savedAmount = overrides.savedAmount ?? 0;
  const currency = overrides.currency ?? Currency.USD;
  const name = overrides.name ?? `Goal ${overrides.id}`;
  const status = overrides.status ?? GoalStatus.Active;
  const versionID = `${overrides.id}-v1`;

  await appDBFake.goals.add({
    id: overrides.id,
    status,
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
    status,
    currency,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
};

const onlyTransaction = () => {
  const txns = appDBFake.transactions.list();
  if (txns.length !== 1) throw new Error(`expected 1 transaction, got ${txns.length}`);
  return txns[0];
};

describe('cancelTransaction', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  describe('soft-cancel (same calendar day)', () => {
    it('restores goal savedAmount when a Spend-from-goal is cancelled same-day', async () => {
      await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 500 });
      const cancelledAt = new Date('2026-03-10T15:00:00');

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: 'lunch',
        amount: '40',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const txn = onlyTransaction();

      await cancelTransaction({ transactionID: txn.id, cancelledAt });

      const goal = await documentDBFake.goal_list.get('goal');
      expect(goal?.savedAmount).toBe(500);
      expect(goal?.remainingAmount).toBe(500);
    });

    it('marks the projection row with cancelledAt and does not append a reversal', async () => {
      await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 500 });
      const sameDay = new Date('2026-03-10T20:00:00');

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: 'taxi',
        amount: '15',
        createdAt: new Date('2026-03-10T08:00:00'),
      });
      const txn = onlyTransaction();

      await cancelTransaction({ transactionID: txn.id, cancelledAt: sameDay });

      const transactions = appDBFake.transactions.list();
      expect(transactions).toHaveLength(1);
      const original = transactions[0];
      expect(original.cancelledAt).toEqual(sameDay);
      expect(original.reversedAt).toBeUndefined();

      const projection = await documentDBFake.transaction_list.get(txn.id);
      expect(projection?.cancelledAt).toEqual(sameDay);
    });

    it('allows a goal to overfill above target — "nothing we can do about it"', async () => {
      await seedGoal({ id: 'goal', targetAmount: 100, savedAmount: 80 });
      const cancelledAt = new Date('2026-03-10T15:00:00');

      // Goal has 80 saved. We spend 30 (down to 50), then someone allocates more
      // bringing it back to 100, then we cancel the original spend — pushing
      // savedAmount to 130 (over the 100 target). Permitted by spec.
      await spendFundsFromGoal({
        goalID: 'goal',
        notes: 'bus',
        amount: '30',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const spendTxn = onlyTransaction();

      // Simulate an external bump back up to 100 saved.
      await documentDBFake.goal_list.update('goal', { savedAmount: 100 });

      await cancelTransaction({ transactionID: spendTxn.id, cancelledAt });

      const goal = await documentDBFake.goal_list.get('goal');
      expect(goal?.savedAmount).toBe(130);
      expect(goal?.savedPercent).toBe(130);
    });

    it('restores both wallets and refunds the fee for a same-day Transfer cancel', async () => {
      await seedWallet('w1', Currency.USD, 1000);
      await seedWallet('w2', Currency.USD, 200);
      const cancelledAt = new Date('2026-03-10T15:00:00');

      await transferFundsBetweenWallets({
        sourceID: 'w1',
        destinationID: 'w2',
        amount: '300',
        fee: '5',
        notes: '',
        createdAt: new Date('2026-03-10T08:00:00'),
      });
      const txn = onlyTransaction();

      const w1Mid = await documentDBFake.wallet_list.get('w1');
      const w2Mid = await documentDBFake.wallet_list.get('w2');
      expect(w1Mid?.currentAmount).toBe(695); // 1000 - 300 - 5
      expect(w2Mid?.currentAmount).toBe(500); // 200 + 300

      await cancelTransaction({ transactionID: txn.id, cancelledAt });

      const w1 = await documentDBFake.wallet_list.get('w1');
      const w2 = await documentDBFake.wallet_list.get('w2');
      expect(w1?.currentAmount).toBe(1000);
      expect(w2?.currentAmount).toBe(200);
    });
  });

  describe('reverse entry (different calendar day)', () => {
    it('appends a reversal transaction with flipped entries on the cancel date', async () => {
      await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 500 });
      const originalAt = new Date('2026-03-10T09:00:00');
      const cancelledAt = new Date('2026-03-15T11:00:00');

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: 'old lunch',
        amount: '50',
        createdAt: originalAt,
      });
      const original = onlyTransaction();

      await cancelTransaction({ transactionID: original.id, cancelledAt });

      const txns = appDBFake.transactions.list();
      expect(txns).toHaveLength(2);
      const reversal = txns.find(t => t.id !== original.id);
      expect(reversal).toBeDefined();
      expect(reversal?.reversalOfID).toBe(original.id);
      expect(reversal?.type).toBe(TransactionType.Spend);
      expect(reversal?.createdAt).toEqual(cancelledAt);
      expect(reversal?.notes).toBe(`Reversal of "old lunch"`);

      const updated = appDBFake.transactions.list().find(t => t.id === original.id);
      expect(updated?.reversedAt).toEqual(cancelledAt);
      expect(updated?.cancelledAt).toBeUndefined();

      const goal = await documentDBFake.goal_list.get('goal');
      expect(goal?.savedAmount).toBe(500);
    });

    it('flips entry directions on the reversal so the ledger nets to zero', async () => {
      await seedGoal({ id: 'goal', targetAmount: 1000, savedAmount: 500 });

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: 'food',
        amount: '20',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const original = onlyTransaction();

      await cancelTransaction({
        transactionID: original.id,
        cancelledAt: new Date('2026-03-12T09:00:00'),
      });

      const reversal = appDBFake.transactions.list()
        .find(t => t.reversalOfID === original.id);
      const reversalEntries = appDBFake.transaction_entries.list()
        .filter(e => e.transactionID === reversal?.id);
      const originalEntries = appDBFake.transaction_entries.list()
        .filter(e => e.transactionID === original.id);

      expect(reversalEntries).toHaveLength(originalEntries.length);
      for (const oe of originalEntries) {
        const flipped = reversalEntries.find(re =>
          re.sourceType === oe.sourceType && re.sourceID === oe.sourceID);
        expect(flipped).toBeDefined();
        expect(flipped?.direction).not.toBe(oe.direction);
        expect(flipped?.amount).toBe(oe.amount);
      }
    });

    it('preserves the original FX rate on a Convert reversal', async () => {
      await seedWallet('usd', Currency.USD, 1000);
      await seedWallet('php', Currency.Peso, 0);
      const originalAt = new Date('2026-03-10T09:00:00');
      const cancelledAt = new Date('2026-03-15T11:00:00');

      // Original convert: 100 USD → 5500 PHP at a 55-rate.
      await convertFundsBetweenWallets({
        sourceID: 'usd',
        destinationID: 'php',
        amountSent: '100',
        fee: '0',
        amountReceived: '5500',
        notes: '',
        createdAt: originalAt,
      });
      const original = onlyTransaction();

      await cancelTransaction({ transactionID: original.id, cancelledAt });

      const reversalEntries = appDBFake.transaction_entries.list()
        .filter(e => e.transactionID !== original.id);
      const usdLeg = reversalEntries.find(e => e.currency === Currency.USD);
      const phpLeg = reversalEntries.find(e => e.currency === Currency.Peso);

      expect(usdLeg?.amount).toBe(100);
      expect(phpLeg?.amount).toBe(5500);

      // Wallet balances net out to the pre-convert state.
      const usd = await documentDBFake.wallet_list.get('usd');
      const php = await documentDBFake.wallet_list.get('php');
      expect(usd?.currentAmount).toBe(1000);
      expect(php?.currentAmount).toBe(0);
    });
  });

  describe('eligibility guards', () => {
    it('rejects an Allocate transaction', async () => {
      await seedWallet('wallet', Currency.USD, 500);
      await seedGoal({ id: 'goal' });

      await allocateFundsToGoal({
        sourceID: 'wallet',
        destinationID: 'goal',
        amount: '100',
        notes: '',
      });
      const txn = onlyTransaction();

      await expect(cancelTransaction({ transactionID: txn.id }))
        .rejects.toBeInstanceOf(AppError);
    });

    it('rejects a Deallocate transaction', async () => {
      await seedWallet('wallet', Currency.USD, 200);

      await deallocateFundsFromWallet({
        walletID: 'wallet',
        amount: '50',
        notes: '',
      });
      const txn = onlyTransaction();

      await expect(cancelTransaction({ transactionID: txn.id }))
        .rejects.toBeInstanceOf(AppError);
    });

    it('rejects when the source goal is completed', async () => {
      await seedGoal({ id: 'goal', savedAmount: 500, status: GoalStatus.Active });

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: '',
        amount: '20',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const txn = onlyTransaction();

      // Now "complete" the goal post-spend.
      await appDBFake.goals.put({
        id: 'goal',
        status: GoalStatus.Completed,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-03-12'),
      });

      await expect(cancelTransaction({ transactionID: txn.id }))
        .rejects.toBeInstanceOf(AppError);
    });

    it('rejects when the source goal is archived', async () => {
      await seedGoal({ id: 'goal', savedAmount: 500 });

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: '',
        amount: '20',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const txn = onlyTransaction();

      await appDBFake.goals.put({
        id: 'goal',
        status: GoalStatus.Archived,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-03-12'),
      });

      await expect(cancelTransaction({ transactionID: txn.id }))
        .rejects.toBeInstanceOf(AppError);
    });

    it('rejects an already-cancelled transaction', async () => {
      await seedGoal({ id: 'goal', savedAmount: 500 });

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: '',
        amount: '20',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const txn = onlyTransaction();

      await cancelTransaction({
        transactionID: txn.id,
        cancelledAt: new Date('2026-03-10T15:00:00'),
      });

      await expect(cancelTransaction({
        transactionID: txn.id,
        cancelledAt: new Date('2026-03-10T16:00:00'),
      })).rejects.toBeInstanceOf(AppError);
    });

    it('rejects an already-reversed transaction', async () => {
      await seedGoal({ id: 'goal', savedAmount: 500 });

      await spendFundsFromGoal({
        goalID: 'goal',
        notes: '',
        amount: '20',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const txn = onlyTransaction();

      await cancelTransaction({
        transactionID: txn.id,
        cancelledAt: new Date('2026-03-15T15:00:00'),
      });

      await expect(cancelTransaction({
        transactionID: txn.id,
        cancelledAt: new Date('2026-03-16T16:00:00'),
      })).rejects.toBeInstanceOf(AppError);
    });

    it('refuses to cancel a reversal entry itself', async () => {
      await seedWallet('w1', Currency.USD, 500);
      await seedWallet('w2', Currency.USD, 0);

      await spendFundsFromWallet({
        walletID: 'w1',
        notes: '',
        amount: '50',
        createdAt: new Date('2026-03-10T09:00:00'),
      });
      const original = onlyTransaction();

      await cancelTransaction({
        transactionID: original.id,
        cancelledAt: new Date('2026-03-15T09:00:00'),
      });

      const reversal = appDBFake.transactions.list()
        .find(t => t.reversalOfID === original.id);
      expect(reversal).toBeDefined();

      await expect(cancelTransaction({ transactionID: reversal!.id }))
        .rejects.toBeInstanceOf(AppError);
    });
  });
});
