import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import allocateFundsToWallet from '@/features/transactions/api/allocate-funds-to-wallet';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
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

describe('allocateFundsToWallet', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('credits the wallet by the parsed amount', async () => {
    await seedWallet({ currentAmount: 250.50 });

    await allocateFundsToWallet({ walletID: 'wallet-1', amount: '49.50' });

    const updated = await documentDBFake.wallet_list.get('wallet-1');
    expect(updated?.currentAmount).toBe(300);
  });

  it('handles fractional cents using currency precision', async () => {
    await seedWallet({ currentAmount: 10 });

    await allocateFundsToWallet({ walletID: 'wallet-1', amount: '0.105' });

    const updated = await documentDBFake.wallet_list.get('wallet-1');
    expect(updated?.currentAmount).toBe(10.11);
  });

  it('records a from External -> to Wallet entry pair with matching amounts', async () => {
    await seedWallet({ currentAmount: 0 });

    await allocateFundsToWallet({ walletID: 'wallet-1', amount: '75' });

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      sourceID: null,
      amount: 75,
      currency: Currency.USD,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.Wallet,
      sourceID: 'wallet-1',
      amount: 75,
      currency: Currency.USD,
    });
  });

  it('writes one Allocate transaction header and one transaction list row', async () => {
    await seedWallet({ currentAmount: 0 });

    await allocateFundsToWallet({ walletID: 'wallet-1', amount: '20' });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Allocate);

    const transactionListRows = documentDBFake.transaction_list.list();
    expect(transactionListRows).toHaveLength(1);
    expect(transactionListRows[0].type).toBe(TransactionType.Allocate);
  });

  it('rejects when the wallet does not exist', async () => {
    await expect(
      allocateFundsToWallet({ walletID: 'missing', amount: '10' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a zero amount without mutating the wallet', async () => {
    await seedWallet({ currentAmount: 100 });

    await expect(
      allocateFundsToWallet({ walletID: 'wallet-1', amount: '0' }),
    ).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet-1');
    expect(wallet?.currentAmount).toBe(100);
  });

  it('rejects a negative amount', async () => {
    await seedWallet({ currentAmount: 100 });

    await expect(
      allocateFundsToWallet({ walletID: 'wallet-1', amount: '-25' }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
