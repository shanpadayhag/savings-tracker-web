import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import transferFundsBetweenWallets from '@/features/transactions/api/transfer-funds-between-wallets';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (
  id: string,
  currency: Currency,
  currentAmount: number,
  name = `Wallet ${id}`,
) => {
  const wallet = {
    id,
    name,
    currency,
    currentAmount,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  await documentDBFake.wallet_list.add(wallet);
  return wallet;
};

describe('transferFundsBetweenWallets', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('moves the exact amount and debits the fee from the source only', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.USD, 250);

    await transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '300',
      fee: '15',
      notes: '',
    });

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(685);
    expect(destination?.currentAmount).toBe(550);
  });

  it('does not produce a fee entry when fee is zero', async () => {
    await seedWallet('source', Currency.USD, 500);
    await seedWallet('destination', Currency.USD, 0);

    await transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '120',
      fee: '0',
      notes: '',
    });

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(380);
    expect(destination?.currentAmount).toBe(120);

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    expect(entries.find(entry => entry.sourceType === TransactionSourceType.Internal)).toBeUndefined();
  });

  it('records source and destination entries with the same amount', async () => {
    await seedWallet('source', Currency.USD, 200);
    await seedWallet('destination', Currency.USD, 0);

    await transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '75.25',
      fee: '0.50',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From && entry.sourceType === TransactionSourceType.Wallet);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To && entry.sourceType === TransactionSourceType.Wallet);
    expect(fromEntry?.amount).toBe(75.25);
    expect(toEntry?.amount).toBe(75.25);
  });

  it('writes a Transfer transaction with trimmed notes', async () => {
    await seedWallet('source', Currency.USD, 200);
    await seedWallet('destination', Currency.USD, 0);

    await transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '50',
      fee: '0',
      notes: '  rent split  ',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Transfer);
    expect(transactions[0].notes).toBe('rent split');
  });

  it('rejects when wallet currencies differ', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.Peso, 0);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '50',
      fee: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const source = await documentDBFake.wallet_list.get('source');
    expect(source?.currentAmount).toBe(1000);
  });

  it('rejects when source funds cannot cover amount + fee', async () => {
    await seedWallet('source', Currency.USD, 100);
    await seedWallet('destination', Currency.USD, 0);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '100',
      fee: '0.01',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(100);
    expect(destination?.currentAmount).toBe(0);
  });

  it('rejects when source and destination are the same', async () => {
    await seedWallet('source', Currency.USD, 1000);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'source',
      amount: '50',
      fee: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a zero or negative amount', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.USD, 0);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '0',
      fee: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '-5',
      fee: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a negative fee', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.USD, 0);

    await expect(transferFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amount: '10',
      fee: '-1',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });
});
