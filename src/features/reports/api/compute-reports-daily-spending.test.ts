import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeReportsDailySpending from '@/features/reports/api/compute-reports-daily-spending';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // May 15, 2026 noon

type EntryInput = {
  type: TransactionSourceType;
  sourceID?: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

const seedTransaction = async (
  id: string,
  type: TransactionType,
  createdAt: Date,
  entries: EntryInput[],
) => {
  await documentDBFake.transaction_list.add({
    id, type, notes: null,
    entries: entries.map(entry => ({
      type: entry.type,
      sourceID: entry.sourceID ?? null,
      name: null,
      currency: entry.currency,
      direction: entry.direction,
      amount: entry.amount,
    })),
    createdAt, updatedAt: createdAt,
  });
};

const seedSpend = (id: string, createdAt: Date, currency: Currency, amount: number) =>
  seedTransaction(id, TransactionType.Spend, createdAt, [
    { type: TransactionSourceType.Goal, sourceID: 'g', currency, direction: TransactionDirection.From, amount },
    { type: TransactionSourceType.External, currency, direction: TransactionDirection.To, amount },
  ]);

describe('computeReportsDailySpending', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns 84 zeroed days ending at "now"', async () => {
    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });

    expect(points).toHaveLength(84);
    expect(points.every(point => point.amount === 0)).toBe(true);
    const last = points[points.length - 1].date;
    expect(last.getFullYear()).toBe(2026);
    expect(last.getMonth()).toBe(4);
    expect(last.getDate()).toBe(15);
  });

  it('honors a custom day count', async () => {
    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW, days: 7 });
    expect(points).toHaveLength(7);
  });

  it('aggregates multiple spends in the same day', async () => {
    await seedSpend('s1', new Date(2026, 4, 14, 9, 0, 0), Currency.USD, 50);
    await seedSpend('s2', new Date(2026, 4, 14, 18, 30, 0), Currency.USD, 25);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
    const may14 = points.find(point =>
      point.date.getFullYear() === 2026
      && point.date.getMonth() === 4
      && point.date.getDate() === 14);

    expect(may14?.amount).toBe(75);
  });

  it('places spends in the day they occurred regardless of time of day', async () => {
    await seedSpend('s-late', new Date(2026, 4, 13, 23, 59, 0), Currency.USD, 10);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
    const may13 = points.find(point => point.date.getDate() === 13 && point.date.getMonth() === 4);

    expect(may13?.amount).toBe(10);
  });

  it('ignores spends outside the trailing window', async () => {
    await seedSpend('old', new Date(2025, 0, 5), Currency.USD, 999);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });

    expect(points.every(point => point.amount === 0)).toBe(true);
  });

  it('ignores transactions in other currencies', async () => {
    await seedSpend('peso', new Date(2026, 4, 14), Currency.Peso, 5000);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });

    expect(points.every(point => point.amount === 0)).toBe(true);
  });

  it('ignores non-Spend transactions', async () => {
    await seedTransaction('alloc', TransactionType.Allocate, new Date(2026, 4, 14), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1000 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 1000 },
    ]);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });

    expect(points.every(point => point.amount === 0)).toBe(true);
  });
});
