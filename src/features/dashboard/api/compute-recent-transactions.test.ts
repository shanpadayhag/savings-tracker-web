import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeRecentTransactions from '@/features/dashboard/api/compute-recent-transactions';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

type EntryInput = {
  type: TransactionSourceType;
  sourceID?: string | null;
  name?: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

const seedTransaction = async (
  id: string,
  type: TransactionType,
  createdAt: Date,
  entries: EntryInput[],
  notes: string | null = null,
) => {
  await documentDBFake.transaction_list.add({
    id,
    type,
    notes,
    entries: entries.map(entry => ({
      type: entry.type,
      sourceID: entry.sourceID ?? null,
      name: entry.name ?? null,
      currency: entry.currency,
      direction: entry.direction,
      amount: entry.amount,
    })),
    createdAt,
    updatedAt: createdAt,
  });
};

describe('computeRecentTransactions', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns rows sorted by createdAt descending', async () => {
    await seedTransaction('t-old', TransactionType.Allocate, new Date(2026, 4, 1), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);
    await seedTransaction('t-new', TransactionType.Allocate, new Date(2026, 4, 10), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
    ]);

    const rows = await computeRecentTransactions(Currency.USD);

    expect(rows.map(row => row.id)).toEqual(['t-new', 't-old']);
  });

  it('caps results to the requested limit', async () => {
    for (let i = 0; i < 8; i += 1) {
      await seedTransaction(`t-${i}`, TransactionType.Allocate, new Date(2026, 4, i + 1), [
        { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 10 },
        { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 10 },
      ]);
    }

    const rows = await computeRecentTransactions(Currency.USD, { limit: 3 });

    expect(rows).toHaveLength(3);
  });

  it('excludes transactions with no entries in the active currency', async () => {
    await seedTransaction('peso', TransactionType.Allocate, new Date(2026, 4, 5), [
      { type: TransactionSourceType.External, currency: Currency.Peso, direction: TransactionDirection.From, amount: 5000 },
      { type: TransactionSourceType.Wallet, sourceID: 'p', name: 'Peso Wallet', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5000 },
    ]);

    const usdRows = await computeRecentTransactions(Currency.USD);

    expect(usdRows).toEqual([]);
  });

  it('renders an Allocate-from-external as a green inflow into the destination wallet', async () => {
    await seedTransaction('alloc-external', TransactionType.Allocate, new Date(2026, 4, 10), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'Checking',
      counterparty: 'Funds added',
      amount: 500,
      prefix: '+',
    });
  });

  it('renders an Allocate-to-goal with the source wallet as counterparty', async () => {
    await seedTransaction('alloc-goal', TransactionType.Allocate, new Date(2026, 4, 11), [
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Goal, sourceID: 'g', name: 'Emergency Fund', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'Emergency Fund',
      counterparty: 'from Checking',
      amount: 100,
      prefix: '+',
    });
  });

  it('renders a Spend with notes as the counterparty when present', async () => {
    await seedTransaction('spend', TransactionType.Spend, new Date(2026, 4, 12), [
      { type: TransactionSourceType.Goal, sourceID: 'g', name: 'Travel Fund', currency: Currency.USD, direction: TransactionDirection.From, amount: 75 },
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 75 },
    ], 'Flights to Tokyo');

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'Travel Fund',
      counterparty: 'Flights to Tokyo',
      amount: 75,
      prefix: '-',
    });
  });

  it('falls back to "Spent" when a Spend has no notes', async () => {
    await seedTransaction('spend', TransactionType.Spend, new Date(2026, 4, 12), [
      { type: TransactionSourceType.Goal, sourceID: 'g', name: 'Travel Fund', currency: Currency.USD, direction: TransactionDirection.From, amount: 30 },
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 30 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row.counterparty).toBe('Spent');
  });

  it('renders a Deallocate as a goal-to-wallet outflow with the wallet as counterparty', async () => {
    await seedTransaction('dealloc', TransactionType.Deallocate, new Date(2026, 4, 13), [
      { type: TransactionSourceType.Goal, sourceID: 'g', name: 'Old Goal', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'Old Goal',
      counterparty: 'to Checking',
      amount: 200,
      prefix: '-',
    });
  });

  it('renders a Transfer as a neutral source→destination row with no prefix', async () => {
    await seedTransaction('transfer', TransactionType.Transfer, new Date(2026, 4, 14), [
      { type: TransactionSourceType.Wallet, sourceID: 'a', name: 'Checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 300 },
      { type: TransactionSourceType.Wallet, sourceID: 'b', name: 'Savings', currency: Currency.USD, direction: TransactionDirection.To, amount: 300 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'Checking → Savings',
      counterparty: 'Transfer',
      amount: 300,
      prefix: '',
    });
  });

  it('renders a cross-currency Convert as outflow when active currency is the source', async () => {
    await seedTransaction('convert', TransactionType.Convert, new Date(2026, 4, 15), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', name: 'USD Wallet', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', name: 'Peso Wallet', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
    ]);

    const [row] = await computeRecentTransactions(Currency.USD);

    expect(row).toMatchObject({
      label: 'USD Wallet → Peso Wallet',
      counterparty: 'Convert',
      amount: 100,
      prefix: '-',
      currency: Currency.USD,
    });
  });

  it('renders a cross-currency Convert as inflow when active currency is the destination', async () => {
    await seedTransaction('convert', TransactionType.Convert, new Date(2026, 4, 15), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', name: 'USD Wallet', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', name: 'Peso Wallet', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
    ]);

    const [row] = await computeRecentTransactions(Currency.Peso);

    expect(row).toMatchObject({
      label: 'USD Wallet → Peso Wallet',
      counterparty: 'Convert',
      amount: 5500,
      prefix: '+',
      currency: Currency.Peso,
    });
  });
});
