import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeReportsSummary from '@/features/reports/api/compute-reports-summary';
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

const seedIncome = (id: string, createdAt: Date, currency: Currency, amount: number) =>
  seedTransaction(id, TransactionType.Allocate, createdAt, [
    { type: TransactionSourceType.External, currency, direction: TransactionDirection.From, amount },
    { type: TransactionSourceType.Wallet, sourceID: 'w', currency, direction: TransactionDirection.To, amount },
  ]);

const seedSpend = (id: string, createdAt: Date, currency: Currency, amount: number) =>
  seedTransaction(id, TransactionType.Spend, createdAt, [
    { type: TransactionSourceType.Goal, sourceID: 'g', currency, direction: TransactionDirection.From, amount },
    { type: TransactionSourceType.External, currency, direction: TransactionDirection.To, amount },
  ]);

describe('computeReportsSummary', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns zeroed summary when there are no transactions', async () => {
    const summary = await computeReportsSummary(Currency.USD, '3m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpense).toBe(0);
    expect(summary.netSaved).toBe(0);
    expect(summary.savingsRate).toBe(0);
    expect(summary.incomeChangePercent).toBe(0);
    expect(summary.expenseChangePercent).toBe(0);
    expect(summary.netChangePercent).toBe(0);
    expect(summary.savingsRateChangePercent).toBe(0);
  });

  it('aggregates income and expense over the selected window', async () => {
    await seedIncome('inc-may', new Date(2026, 4, 5), Currency.USD, 1000);
    await seedIncome('inc-apr', new Date(2026, 3, 5), Currency.USD, 1500);
    await seedSpend('exp-may', new Date(2026, 4, 6), Currency.USD, 200);
    await seedSpend('exp-apr', new Date(2026, 3, 12), Currency.USD, 350);

    const summary = await computeReportsSummary(Currency.USD, '3m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(2500);
    expect(summary.totalExpense).toBe(550);
    expect(summary.netSaved).toBe(1950);
    expect(summary.savingsRate).toBeCloseTo((1950 / 2500) * 100, 5);
  });

  it('includes the current month even when "now" is mid-month', async () => {
    await seedIncome('inc-may', new Date(2026, 4, 14), Currency.USD, 800);

    const summary = await computeReportsSummary(Currency.USD, '1m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(800);
  });

  it('compares against the prior equivalent window for change percentages', async () => {
    // Current 3m window: Mar–May 2026
    await seedIncome('inc-current', new Date(2026, 4, 5), Currency.USD, 2000);
    await seedSpend('exp-current', new Date(2026, 3, 12), Currency.USD, 500);
    // Prior 3m window: Dec 2025–Feb 2026
    await seedIncome('inc-prior', new Date(2026, 1, 5), Currency.USD, 1000);
    await seedSpend('exp-prior', new Date(2025, 11, 20), Currency.USD, 250);

    const summary = await computeReportsSummary(Currency.USD, '3m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(2000);
    expect(summary.totalExpense).toBe(500);
    expect(summary.incomeChangePercent).toBeCloseTo(100, 5);
    expect(summary.expenseChangePercent).toBeCloseTo(100, 5);
  });

  it('ignores transactions outside the active currency', async () => {
    await seedIncome('inc-usd', new Date(2026, 4, 5), Currency.USD, 1000);
    await seedIncome('inc-peso', new Date(2026, 4, 5), Currency.Peso, 50000);

    const summary = await computeReportsSummary(Currency.USD, '1m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(1000);
  });

  it('ignores transactions outside the lookback window', async () => {
    await seedIncome('inc-far-past', new Date(2024, 4, 5), Currency.USD, 9999);

    const summary = await computeReportsSummary(Currency.USD, '3m', { now: FIXED_NOW });

    expect(summary.totalIncome).toBe(0);
  });

  it('counts convert/transfer fees as expense when the source wallet is in the active currency', async () => {
    await seedTransaction('transfer-fee', TransactionType.Transfer, new Date(2026, 4, 7), [
      { type: TransactionSourceType.Wallet, sourceID: 'a', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'b', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
    ]);

    const summary = await computeReportsSummary(Currency.USD, '1m', { now: FIXED_NOW });

    expect(summary.totalExpense).toBe(5);
  });

  it('reports savings rate change in percentage points (current minus prior)', async () => {
    // Current: income 1000, expense 250 → savings rate 75%
    await seedIncome('inc-current', new Date(2026, 4, 5), Currency.USD, 1000);
    await seedSpend('exp-current', new Date(2026, 4, 6), Currency.USD, 250);
    // Prior: income 1000, expense 500 → savings rate 50%
    await seedIncome('inc-prior', new Date(2026, 3, 5), Currency.USD, 1000);
    await seedSpend('exp-prior', new Date(2026, 3, 6), Currency.USD, 500);

    const summary = await computeReportsSummary(Currency.USD, '1m', { now: FIXED_NOW });

    expect(summary.savingsRate).toBeCloseTo(75, 5);
    expect(summary.savingsRateChangePercent).toBeCloseTo(25, 5);
  });
});
