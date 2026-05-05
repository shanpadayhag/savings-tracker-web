import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import convertFundsBetweenWallets from '@/features/transactions/api/convert-funds-between-wallets';
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

describe('convertFundsBetweenWallets', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('debits the source by amountSent + fee and credits the destination by amountReceived', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.Peso, 0);

    await convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '100',
      fee: '5',
      amountReceived: '5500',
      notes: '',
    });

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(895);
    expect(destination?.currentAmount).toBe(5500);
  });

  it('handles a zero fee without producing a fee entry', async () => {
    await seedWallet('source', Currency.USD, 200);
    await seedWallet('destination', Currency.Peso, 100);

    await convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '50',
      fee: '0',
      amountReceived: '2750',
      notes: '',
    });

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(150);
    expect(destination?.currentAmount).toBe(2850);

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    expect(entries.find(entry => entry.sourceType === TransactionSourceType.Internal)).toBeUndefined();
  });

  it('records a fee entry as Internal/To when fee > 0', async () => {
    await seedWallet('source', Currency.USD, 500);
    await seedWallet('destination', Currency.Peso, 0);

    await convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '100',
      fee: '2.50',
      amountReceived: '5500',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    const feeEntry = entries.find(entry => entry.sourceType === TransactionSourceType.Internal);
    expect(feeEntry).toMatchObject({
      direction: TransactionDirection.To,
      amount: 2.50,
      currency: Currency.USD,
      sourceID: null,
    });
  });

  it('writes a Convert transaction with all entries linked to the same transactionID', async () => {
    await seedWallet('source', Currency.USD, 200);
    await seedWallet('destination', Currency.Peso, 0);

    await convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '40',
      fee: '1',
      amountReceived: '2200',
      notes: '  trip  ',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Convert);
    expect(transactions[0].notes).toBe('trip');

    const transactionID = transactions[0].id;
    const entries = appDBFake.transaction_entries.list();
    expect(entries.every(entry => entry.transactionID === transactionID)).toBe(true);
  });

  it('rejects when source and destination are the same', async () => {
    await seedWallet('source', Currency.USD, 1000);

    await expect(convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'source',
      amountSent: '10',
      fee: '0',
      amountReceived: '550',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when source funds cannot cover amount + fee', async () => {
    await seedWallet('source', Currency.USD, 100);
    await seedWallet('destination', Currency.Peso, 0);

    await expect(convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '100',
      fee: '0.01',
      amountReceived: '5500',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(100);
    expect(destination?.currentAmount).toBe(0);
  });

  it('rejects a negative fee', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.Peso, 0);

    await expect(convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '50',
      fee: '-1',
      amountReceived: '2750',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a zero amountReceived', async () => {
    await seedWallet('source', Currency.USD, 1000);
    await seedWallet('destination', Currency.Peso, 0);

    await expect(convertFundsBetweenWallets({
      sourceID: 'source',
      destinationID: 'destination',
      amountSent: '50',
      fee: '0',
      amountReceived: '0',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });
});
