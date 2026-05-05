import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeNetWorthTrend from '@/features/dashboard/api/compute-net-worth-trend';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // 2026-05-15
const TWO_MONTHS_AGO = new Date(2026, 2, 10);

const seedWallet = async (id: string, currency: Currency, currentAmount: number) => {
  await documentDBFake.wallet_list.add({
    id, name: `Wallet ${id}`, currency, currentAmount,
    createdAt: TWO_MONTHS_AGO, updatedAt: FIXED_NOW,
  });
};

const seedGoal = async (id: string, currency: Currency, savedAmount: number, targetAmount = 10000) => {
  await documentDBFake.goal_list.add({
    id, versionID: `${id}-v1`, name: `Goal ${id}`,
    targetAmount, savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status: GoalStatus.Active, currency,
    createdAt: TWO_MONTHS_AGO, updatedAt: FIXED_NOW,
  });
};

type EntryInput = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

const seedTransaction = async (id: string, type: TransactionType, createdAt: Date, entries: EntryInput[]) => {
  await documentDBFake.transaction_list.add({
    id, type, notes: null,
    entries: entries.map(entry => ({
      type: entry.type, sourceID: entry.sourceID, name: null,
      currency: entry.currency, direction: entry.direction, amount: entry.amount,
    })),
    createdAt, updatedAt: createdAt,
  });
};

describe('computeNetWorthTrend', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns the requested number of monthly points, oldest first', async () => {
    await seedWallet('w', Currency.USD, 1000);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 4 });

    expect(trend).toHaveLength(4);
    expect(trend.map(point => point.date)).toEqual([
      'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026',
    ]);
  });

  it('flat-lines when there are no transactions', async () => {
    await seedWallet('w', Currency.USD, 750);
    await seedGoal('g', Currency.USD, 250);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 3 });

    expect(trend.every(point => point.netWorth === 1000)).toBe(true);
  });

  it('reconstructs prior-month net worth by reversing this month allocations', async () => {
    // Now: wallet 1500. This month: +500 allocation. Last month: nothing.
    await seedWallet('w', Currency.USD, 1500);
    await seedTransaction('alloc-this-month', TransactionType.Allocate,
      new Date(2026, 4, 4), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 2 });

    expect(trend).toHaveLength(2);
    // Apr 2026 = before this month's allocation = 1000
    expect(trend[0]).toMatchObject({ date: 'Apr 2026', netWorth: 1000 });
    // May 2026 = current = 1500
    expect(trend[1]).toMatchObject({ date: 'May 2026', netWorth: 1500 });
  });

  it('treats wallet -> goal allocations as net-worth-neutral', async () => {
    await seedWallet('w', Currency.USD, 800);
    await seedGoal('g', Currency.USD, 200);
    // Allocate 200 from wallet to goal this month — net worth unchanged.
    await seedTransaction('alloc-to-goal', TransactionType.Allocate,
      new Date(2026, 4, 5), [
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
    ]);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 2 });

    expect(trend[0].netWorth).toBe(1000);
    expect(trend[1].netWorth).toBe(1000);
  });

  it('treats spend transactions as net-worth-decreasing', async () => {
    await seedWallet('w', Currency.USD, 1000);
    await seedGoal('g', Currency.USD, 500);
    // Spend 100 from goal this month.
    await seedTransaction('spend', TransactionType.Spend,
      new Date(2026, 4, 6), [
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 2 });

    // Apr 2026 = before the spend = 1600
    expect(trend[0].netWorth).toBe(1600);
    // May 2026 = current = 1500
    expect(trend[1].netWorth).toBe(1500);
  });

  it('attributes transfer fees to the source wallet so net worth drops by the fee', async () => {
    await seedWallet('source', Currency.USD, 800);
    await seedWallet('destination', Currency.USD, 200);
    // Transfer 200 with 5 fee this month.
    await seedTransaction('transfer-with-fee', TransactionType.Transfer,
      new Date(2026, 4, 7), [
      { type: TransactionSourceType.Wallet, sourceID: 'source', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'destination', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      { type: TransactionSourceType.Internal, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
    ]);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 2 });

    // Apr 2026 = before fee debit = 1005
    expect(trend[0].netWorth).toBe(1005);
    expect(trend[1].netWorth).toBe(1000);
  });

  it('ignores transactions in other currencies when computing the trend', async () => {
    await seedWallet('usd', Currency.USD, 1000);
    await seedWallet('peso', Currency.Peso, 50000);
    await seedTransaction('peso-alloc', TransactionType.Allocate,
      new Date(2026, 4, 9), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.Peso, direction: TransactionDirection.From, amount: 5000 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5000 },
    ]);

    const usdTrend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 3 });

    expect(usdTrend.every(point => point.netWorth === 1000)).toBe(true);
  });

  it('walks back further when transactions span multiple months', async () => {
    await seedWallet('w', Currency.USD, 1500);
    // Two months ago: +500. Last month: +500. (Now is 1500.)
    await seedTransaction('alloc-march', TransactionType.Allocate,
      new Date(2026, 2, 12), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);
    await seedTransaction('alloc-april', TransactionType.Allocate,
      new Date(2026, 3, 8), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 4 });

    expect(trend.map(point => ({ date: point.date, netWorth: point.netWorth }))).toEqual([
      { date: 'Feb 2026', netWorth: 500 },
      { date: 'Mar 2026', netWorth: 1000 },
      { date: 'Apr 2026', netWorth: 1500 },
      { date: 'May 2026', netWorth: 1500 },
    ]);
  });

  it('caps to maxMonths even with deeper history', async () => {
    await seedWallet('w', Currency.USD, 1000);

    const trend = await computeNetWorthTrend(Currency.USD, { now: FIXED_NOW, maxMonths: 1 });

    expect(trend).toHaveLength(1);
    expect(trend[0]).toMatchObject({ date: 'May 2026', netWorth: 1000 });
  });
});
