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

type SeedOptions = {
  cancelledAt?: Date;
  reversedAt?: Date;
  reversalOfID?: string;
};

const seedTransaction = async (
  id: string,
  type: TransactionType,
  createdAt: Date,
  entries: EntryInput[],
  options: SeedOptions = {},
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
    cancelledAt: options.cancelledAt,
    reversedAt: options.reversedAt,
    reversalOfID: options.reversalOfID,
    createdAt, updatedAt: createdAt,
  });
};

const seedSpend = (id: string, createdAt: Date, currency: Currency, amount: number) =>
  seedTransaction(id, TransactionType.Spend, createdAt, [
    { type: TransactionSourceType.Goal, sourceID: 'g', currency, direction: TransactionDirection.From, amount },
    { type: TransactionSourceType.External, currency, direction: TransactionDirection.To, amount },
  ]);

const seedSpendFromWallet = (id: string, createdAt: Date, currency: Currency, amount: number) =>
  seedTransaction(id, TransactionType.Spend, createdAt, [
    { type: TransactionSourceType.Wallet, sourceID: 'w', currency, direction: TransactionDirection.From, amount },
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

  it('counts wallet-sourced spends on the heatmap', async () => {
    // Regression: the heatmap previously only saw Goal-sourced spends, so
    // wallet-direct spend days appeared empty. Both source types must show.
    await seedSpendFromWallet('w-spend', new Date(2026, 4, 14, 10, 0, 0), Currency.USD, 60);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
    const may14 = points.find(point =>
      point.date.getFullYear() === 2026
      && point.date.getMonth() === 4
      && point.date.getDate() === 14);

    expect(may14?.amount).toBe(60);
  });

  it('aggregates wallet-sourced and goal-sourced spends on the same day', async () => {
    await seedSpend('g-spend', new Date(2026, 4, 14, 9, 0, 0), Currency.USD, 25);
    await seedSpendFromWallet('w-spend', new Date(2026, 4, 14, 18, 0, 0), Currency.USD, 35);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
    const may14 = points.find(point => point.date.getDate() === 14 && point.date.getMonth() === 4);

    expect(may14?.amount).toBe(60);
  });

  it('ignores non-Spend transactions', async () => {
    await seedTransaction('alloc', TransactionType.Allocate, new Date(2026, 4, 14), [
      { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1000 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 1000 },
    ]);

    const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });

    expect(points.every(point => point.amount === 0)).toBe(true);
  });

  describe('cancellation handling', () => {
    it('drops a soft-cancelled spend from its day, leaving 0 with cancelledOnly flagged', async () => {
      const cancelDay = new Date(2026, 4, 14, 9, 0, 0);
      await seedTransaction('soft-cancel', TransactionType.Spend, cancelDay, [
        { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.From, amount: 80 },
        { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 80 },
      ], { cancelledAt: cancelDay });

      const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
      const may14 = points.find(point => point.date.getDate() === 14 && point.date.getMonth() === 4);

      expect(may14?.amount).toBe(0);
      expect(may14?.cancelledOnly).toBe(true);
    });

    it('subtracts a Spend reversal from the cancel-day amount and surfaces reversedAmount', async () => {
      // Original spend on May 10: $50. Reversal entry on May 14: nets the
      // cancel-day's spending down by $50.
      const originalDay = new Date(2026, 4, 10, 9, 0, 0);
      const cancelDay = new Date(2026, 4, 14, 9, 0, 0);
      await seedSpend('original', originalDay, Currency.USD, 50);
      // Mark the original as reversed so the projection reflects the post-cancel state.
      await documentDBFake.transaction_list.update('original', { reversedAt: cancelDay });
      // Same-day fresh spend on May 14 to keep the day above zero net.
      await seedSpend('may14-spend', new Date(2026, 4, 14, 11, 0, 0), Currency.USD, 80);
      // The reversal entry: flipped, dated cancel day, marked as reversal.
      await seedTransaction('reversal', TransactionType.Spend, cancelDay, [
        { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 50 },
        { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.To, amount: 50 },
      ], { reversalOfID: 'original' });

      const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
      const may10 = points.find(point => point.date.getDate() === 10 && point.date.getMonth() === 4);
      const may14 = points.find(point => point.date.getDate() === 14 && point.date.getMonth() === 4);

      // Original day still shows the $50 — history unchanged.
      expect(may10?.amount).toBe(50);
      // Cancel day: $80 fresh spend - $50 reversal = $30, with reversedAmount surfaced.
      expect(may14?.amount).toBe(30);
      expect(may14?.reversedAmount).toBe(50);
    });

    it('clamps net to 0 when the day\'s reversals exceed its spend', async () => {
      const cancelDay = new Date(2026, 4, 14, 9, 0, 0);
      await seedSpend('original', new Date(2026, 4, 10), Currency.USD, 100);
      await documentDBFake.transaction_list.update('original', { reversedAt: cancelDay });
      // Cancel-day has only the reversal — no fresh spends.
      await seedTransaction('reversal', TransactionType.Spend, cancelDay, [
        { type: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
        { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
      ], { reversalOfID: 'original' });

      const points = await computeReportsDailySpending(Currency.USD, { now: FIXED_NOW });
      const may14 = points.find(point => point.date.getDate() === 14 && point.date.getMonth() === 4);

      expect(may14?.amount).toBe(0);
      expect(may14?.reversedAmount).toBe(100);
    });
  });
});
