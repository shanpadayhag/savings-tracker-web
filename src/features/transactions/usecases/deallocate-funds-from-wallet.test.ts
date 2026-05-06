import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import deallocateFundsFromWallet from '@/features/transactions/usecases/deallocate-funds-from-wallet';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (overrides: Partial<{ id: string; currentAmount: number; currency: Currency; name: string; }> = {}) => {
  const wallet = {
    id: overrides.id ?? 'wallet-1',
    name: overrides.name ?? 'Cash',
    currency: overrides.currency ?? Currency.USD,
    currentAmount: overrides.currentAmount ?? 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  await documentDBFake.wallet_list.add(wallet);
  return wallet;
};

describe('deallocateFundsFromWallet', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('debits the wallet by the parsed amount', async () => {
    await seedWallet({ currentAmount: 250.50 });

    await deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '49.50',
      notes: '',
    });

    const updated = await documentDBFake.wallet_list.get('wallet-1');
    expect(updated?.currentAmount).toBe(201);
  });

  it('emits a Wallet/From and External/To entry pair with matching amounts', async () => {
    await seedWallet({ currentAmount: 500 });

    await deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '125.50',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Wallet,
      sourceID: 'wallet-1',
      amount: 125.50,
      currency: Currency.USD,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      sourceID: null,
      amount: 125.50,
      currency: Currency.USD,
    });
  });

  it('writes a Deallocate transaction with no category', async () => {
    await seedWallet({ currentAmount: 500 });

    await deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '40',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Deallocate);
    expect(transactions[0].categoryID).toBeUndefined();

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.type).toBe(TransactionType.Deallocate);
    expect(transactionListRow.categoryID).toBeUndefined();
    expect(transactionListRow.categoryName).toBeUndefined();
    expect(transactionListRow.categoryColor).toBeUndefined();
  });

  it('trims notes and stores null when blank', async () => {
    await seedWallet({ currentAmount: 500 });

    await deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '10',
      notes: '   ',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].notes).toBeNull();
  });

  it('keeps notes when provided', async () => {
    await seedWallet({ currentAmount: 500 });

    await deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '10',
      notes: 'refunded customer #42',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].notes).toBe('refunded customer #42');
  });

  it('rejects when the wallet does not exist', async () => {
    await expect(deallocateFundsFromWallet({
      walletID: 'missing',
      amount: '10',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when no walletID is given', async () => {
    await expect(deallocateFundsFromWallet({
      amount: '10',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a zero amount without mutating the wallet', async () => {
    await seedWallet({ currentAmount: 100 });

    await expect(deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet-1');
    expect(wallet?.currentAmount).toBe(100);
    expect(appDBFake.transactions.list()).toHaveLength(0);
  });

  it('rejects a negative amount', async () => {
    await seedWallet({ currentAmount: 100 });

    await expect(deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '-25',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the wallet cannot cover the refund', async () => {
    await seedWallet({ currentAmount: 30 });

    await expect(deallocateFundsFromWallet({
      walletID: 'wallet-1',
      amount: '100',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet-1');
    expect(wallet?.currentAmount).toBe(30);
    expect(appDBFake.transactions.list()).toHaveLength(0);
  });
});
