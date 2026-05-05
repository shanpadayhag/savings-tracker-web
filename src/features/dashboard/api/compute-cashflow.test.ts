import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeCashflow from '@/features/dashboard/api/compute-cashflow';
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

describe('computeCashflow', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns the requested number of monthly buckets, oldest first', async () => {
    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    expect(points.map(point => point.month)).toEqual(['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']);
  });

  it('counts external→wallet allocations as income in the destination wallet currency', async () => {
    await seedTransaction('alloc', TransactionType.Allocate, new Date(2026, 4, 5), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 1500 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    const may = points.find(point => point.month === 'May');
    expect(may?.income).toBe(1500);
    expect(may?.expense).toBe(0);
  });

  it('does NOT count wallet→goal allocations as income (internal move)', async () => {
    await seedTransaction('alloc-goal', TransactionType.Allocate, new Date(2026, 4, 5), [
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    expect(points.every(point => point.income === 0 && point.expense === 0)).toBe(true);
  });

  it('counts spend transactions as expense in the goal currency', async () => {
    await seedTransaction('spend', TransactionType.Spend, new Date(2026, 4, 6), [
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.From, amount: 220 },
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 220 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    const may = points.find(point => point.month === 'May');
    expect(may?.income).toBe(0);
    expect(may?.expense).toBe(220);
  });

  it('attributes convert/transfer fees as expense when the source wallet is in the active currency', async () => {
    await seedTransaction('transfer-with-fee', TransactionType.Transfer, new Date(2026, 4, 7), [
      { type: TransactionSourceType.Wallet, sourceID: 'a', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'b', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    const may = points.find(point => point.month === 'May');
    expect(may?.income).toBe(0);
    expect(may?.expense).toBe(5);
  });

  it('does not attribute a fee to the destination currency on a cross-currency convert', async () => {
    await seedTransaction('convert', TransactionType.Convert, new Date(2026, 4, 8), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
    ]);

    const usdPoints = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });
    const pesoPoints = await computeCashflow(Currency.Peso, { now: FIXED_NOW, months: 6 });

    expect(usdPoints.find(point => point.month === 'May')?.expense).toBe(2);
    expect(pesoPoints.find(point => point.month === 'May')?.expense).toBe(0);
  });

  it('buckets transactions into the correct month even with multiple per month', async () => {
    await seedTransaction('inc-1', TransactionType.Allocate, new Date(2026, 3, 5), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1000 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 1000 },
    ]);
    await seedTransaction('inc-2', TransactionType.Allocate, new Date(2026, 3, 25), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);
    await seedTransaction('exp', TransactionType.Spend, new Date(2026, 3, 12), [
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.From, amount: 350 },
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 350 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    const apr = points.find(point => point.month === 'Apr');
    expect(apr?.income).toBe(1500);
    expect(apr?.expense).toBe(350);
  });

  it('ignores transactions outside the lookback window', async () => {
    await seedTransaction('old-income', TransactionType.Allocate, new Date(2025, 8, 5), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 9999 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 9999 },
    ]);

    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    expect(points.every(point => point.income === 0)).toBe(true);
  });

  it('returns zero-filled buckets when there are no transactions', async () => {
    const points = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    expect(points.every(point => point.income === 0 && point.expense === 0)).toBe(true);
  });

  it('ignores transactions in other currencies', async () => {
    await seedTransaction('peso-income', TransactionType.Allocate, new Date(2026, 4, 5), [
      { type: TransactionSourceType.External, currency: Currency.Peso, direction: TransactionDirection.From, amount: 5000 },
      { type: TransactionSourceType.Wallet, sourceID: 'p', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5000 },
    ]);

    const usdPoints = await computeCashflow(Currency.USD, { now: FIXED_NOW, months: 6 });

    expect(usdPoints.every(point => point.income === 0)).toBe(true);
  });
});
