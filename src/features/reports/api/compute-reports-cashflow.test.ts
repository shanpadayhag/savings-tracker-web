import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeReportsCashflow from '@/features/reports/api/compute-reports-cashflow';
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

describe('computeReportsCashflow', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns one zeroed point per month for the selected range', async () => {
    const points = await computeReportsCashflow(Currency.USD, '3m', { now: FIXED_NOW });

    expect(points).toHaveLength(3);
    expect(points.map(point => point.month)).toEqual(['Mar', 'Apr', 'May']);
    expect(points.every(point => point.income === 0 && point.expense === 0 && point.savingsRate === 0)).toBe(true);
  });

  it('computes savings rate per month from real transactions', async () => {
    await seedIncome('inc-may', new Date(2026, 4, 5), Currency.USD, 1000);
    await seedSpend('exp-may', new Date(2026, 4, 6), Currency.USD, 250);

    const points = await computeReportsCashflow(Currency.USD, '1m', { now: FIXED_NOW });

    expect(points).toHaveLength(1);
    expect(points[0].income).toBe(1000);
    expect(points[0].expense).toBe(250);
    expect(points[0].savingsRate).toBeCloseTo(75, 5);
  });

  it('returns 0 savings rate when income is 0 even if there is expense', async () => {
    await seedSpend('exp-only', new Date(2026, 4, 6), Currency.USD, 200);

    const points = await computeReportsCashflow(Currency.USD, '1m', { now: FIXED_NOW });

    expect(points[0].income).toBe(0);
    expect(points[0].expense).toBe(200);
    expect(points[0].savingsRate).toBe(0);
  });

  it('produces a 12m series sized for the largest range', async () => {
    const points = await computeReportsCashflow(Currency.USD, '12m', { now: FIXED_NOW });

    expect(points).toHaveLength(12);
  });

  it('cashflow chart per-month sum matches the summary card Total Income (parity)', async () => {
    // Live diagnosis: the user reported Total Income (KPI) showing 101,700
    // while the cashflow chart only added up to 1,700. Both surfaces should
    // include the cross-currency convert as income on the destination
    // ledger, so summing the chart's monthly income across the same window
    // must equal the summary card's totalIncome.
    const { default: computeReportsSummary } = await import('@/features/reports/api/compute-reports-summary');

    // 1,700 of "real" income spread across two months
    await seedIncome('inc-may', new Date(2026, 4, 5), Currency.Peso, 1000);
    await seedIncome('inc-apr', new Date(2026, 3, 20), Currency.Peso, 700);
    // 100,000 PESO arriving from a USD → PESO convert this month
    await seedTransaction('convert-may', TransactionType.Convert, new Date(2026, 4, 10), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.From, amount: 1820 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 100000 },
    ]);

    const summary = await computeReportsSummary(Currency.Peso, '3m', { now: FIXED_NOW });
    const points = await computeReportsCashflow(Currency.Peso, '3m', { now: FIXED_NOW });

    const cashflowIncomeTotal = points.reduce((sum, point) => sum + point.income, 0);
    expect(summary.totalIncome).toBe(101700);
    expect(cashflowIncomeTotal).toBe(101700);
    expect(cashflowIncomeTotal).toBe(summary.totalIncome);
  });

  it('cashflow chart per-month sum matches the summary card Total Spending (parity)', async () => {
    const { default: computeReportsSummary } = await import('@/features/reports/api/compute-reports-summary');

    await seedSpend('exp-may', new Date(2026, 4, 6), Currency.USD, 250);
    await seedSpend('exp-apr', new Date(2026, 3, 12), Currency.USD, 75);
    // Convert source side: USD loses 100 + 2 fee
    await seedTransaction('convert-may', TransactionType.Convert, new Date(2026, 4, 10), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
      { type: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
    ]);

    const summary = await computeReportsSummary(Currency.USD, '3m', { now: FIXED_NOW });
    const points = await computeReportsCashflow(Currency.USD, '3m', { now: FIXED_NOW });

    const cashflowExpenseTotal = points.reduce((sum, point) => sum + point.expense, 0);
    expect(summary.totalExpense).toBe(427); // 250 + 75 + 100 + 2
    expect(cashflowExpenseTotal).toBe(427);
    expect(cashflowExpenseTotal).toBe(summary.totalExpense);
  });
});
