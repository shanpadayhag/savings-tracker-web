import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeReportsSpendingByCategory from '@/features/reports/api/compute-reports-spending-by-category';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15); // May 15, 2026

type EntryInput = {
  type: TransactionSourceType;
  sourceID?: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type SeedSpendOptions = {
  id: string;
  createdAt: Date;
  currency: Currency;
  amount: number;
  categoryName?: string;
  /** Source side of the Spend. Defaults to Goal — set 'wallet' for the
   * wallet-direct spend path (regression coverage). */
  source?: 'goal' | 'wallet';
};

const seedSpend = async (options: SeedSpendOptions) => {
  const sourceType = options.source === 'wallet'
    ? TransactionSourceType.Wallet
    : TransactionSourceType.Goal;
  const entries: EntryInput[] = [
    { type: sourceType, sourceID: 's', currency: options.currency, direction: TransactionDirection.From, amount: options.amount },
    { type: TransactionSourceType.External, currency: options.currency, direction: TransactionDirection.To, amount: options.amount },
  ];
  await documentDBFake.transaction_list.add({
    id: options.id,
    type: TransactionType.Spend,
    notes: null,
    entries: entries.map(entry => ({
      type: entry.type,
      sourceID: entry.sourceID ?? null,
      name: null,
      currency: entry.currency,
      direction: entry.direction,
      amount: entry.amount,
    })),
    categoryName: options.categoryName,
    createdAt: options.createdAt,
    updatedAt: options.createdAt,
  });
};

describe('computeReportsSpendingByCategory', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns an empty list when there are no spend transactions', async () => {
    const result = await computeReportsSpendingByCategory(Currency.USD, '3m', { now: FIXED_NOW });
    expect(result).toEqual([]);
  });

  it('groups spend amounts and counts by category name', async () => {
    await seedSpend({ id: 's1', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 100, categoryName: 'Groceries' });
    await seedSpend({ id: 's2', createdAt: new Date(2026, 4, 10), currency: Currency.USD, amount: 50, categoryName: 'Groceries' });
    await seedSpend({ id: 's3', createdAt: new Date(2026, 4, 12), currency: Currency.USD, amount: 200, categoryName: 'Rent' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });
    const groceries = result.find(category => category.name === 'Groceries');
    const rent = result.find(category => category.name === 'Rent');

    expect(groceries).toMatchObject({ amount: 150, transactionCount: 2 });
    expect(rent).toMatchObject({ amount: 200, transactionCount: 1 });
  });

  it('falls back to "Others" when a transaction has no category name', async () => {
    await seedSpend({ id: 's1', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 80 });
    await seedSpend({ id: 's2', createdAt: new Date(2026, 4, 6), currency: Currency.USD, amount: 20, categoryName: '   ' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });

    expect(result).toEqual([
      expect.objectContaining({ name: 'Others', amount: 100, transactionCount: 2 }),
    ]);
  });

  it('compares each category against the prior equivalent window', async () => {
    // Current 3m window: Mar–May 2026
    await seedSpend({ id: 'cur', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 200, categoryName: 'Groceries' });
    // Prior 3m window: Dec 2025–Feb 2026
    await seedSpend({ id: 'prior', createdAt: new Date(2026, 1, 5), currency: Currency.USD, amount: 100, categoryName: 'Groceries' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '3m', { now: FIXED_NOW });

    expect(result).toEqual([
      expect.objectContaining({ name: 'Groceries', amount: 200, changePercent: 100 }),
    ]);
  });

  it('reports 0% change for a category that did not exist in the prior period', async () => {
    await seedSpend({ id: 'cur', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 75, categoryName: 'New Category' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });

    expect(result[0]).toMatchObject({ name: 'New Category', changePercent: 0 });
  });

  it('ignores spends from other currencies', async () => {
    await seedSpend({ id: 'usd', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 100, categoryName: 'Groceries' });
    await seedSpend({ id: 'peso', createdAt: new Date(2026, 4, 5), currency: Currency.Peso, amount: 5000, categoryName: 'Groceries' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });

    expect(result).toEqual([
      expect.objectContaining({ name: 'Groceries', amount: 100, transactionCount: 1 }),
    ]);
  });

  it('groups wallet-sourced spends by category alongside goal-sourced spends', async () => {
    // Regression: wallet-direct Spend rows were filtered out, leaving every
    // category bucket missing the wallet-sourced share of its spending.
    await seedSpend({ id: 'goal-spend', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 100, categoryName: 'Groceries' });
    await seedSpend({ id: 'wallet-spend', createdAt: new Date(2026, 4, 6), currency: Currency.USD, amount: 75, categoryName: 'Groceries', source: 'wallet' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });
    const groceries = result.find(category => category.name === 'Groceries');

    expect(groceries).toMatchObject({ amount: 175, transactionCount: 2 });
  });

  it('counts wallet-only category buckets', async () => {
    await seedSpend({ id: 'wallet-only', createdAt: new Date(2026, 4, 5), currency: Currency.USD, amount: 40, categoryName: 'Coffee', source: 'wallet' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '1m', { now: FIXED_NOW });

    expect(result).toEqual([
      expect.objectContaining({ name: 'Coffee', amount: 40, transactionCount: 1 }),
    ]);
  });

  it('ignores transactions outside the lookback window', async () => {
    await seedSpend({ id: 'old', createdAt: new Date(2024, 4, 5), currency: Currency.USD, amount: 999, categoryName: 'Old' });

    const result = await computeReportsSpendingByCategory(Currency.USD, '3m', { now: FIXED_NOW });

    expect(result).toEqual([]);
  });
});
