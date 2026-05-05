import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeDashboardInsights from '@/features/dashboard/api/compute-dashboard-insights';
import { DashboardSummary } from '@/features/dashboard/api/compute-dashboard-summary';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0);
const MID_LAST_MONTH = new Date(2026, 3, 14);

const makeSummary = (overrides: Partial<DashboardSummary> = {}): DashboardSummary => ({
  netWorth: 0, netWorthChangePercent: 0,
  walletsBalance: 0, walletsBalanceChangePercent: 0,
  goalsBalance: 0, goalsBalanceChangePercent: 0,
  monthlySpend: 0, monthlySpendChangePercent: 0,
  ...overrides,
});

const seedGoal = async (
  id: string,
  name: string,
  currency: Currency,
  savedAmount: number,
  targetAmount: number,
  status: GoalStatus = GoalStatus.Active,
) => {
  await documentDBFake.goal_list.add({
    id,
    versionID: `${id}-v1`,
    name,
    targetAmount,
    savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status,
    currency,
    createdAt: new Date(2026, 0, 1),
    updatedAt: FIXED_NOW,
  });
};

const seedSpend = async (
  id: string,
  goalID: string,
  currency: Currency,
  amount: number,
  createdAt: Date,
) => {
  await documentDBFake.transaction_list.add({
    id,
    type: TransactionType.Spend,
    notes: null,
    entries: [
      { type: TransactionSourceType.Goal, sourceID: goalID, name: null, currency, direction: TransactionDirection.From, amount },
      { type: TransactionSourceType.External, sourceID: null, name: null, currency, direction: TransactionDirection.To, amount },
    ],
    createdAt,
    updatedAt: createdAt,
  });
};

describe('computeDashboardInsights', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('returns an empty list when nothing is meaningful', async () => {
    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights).toEqual([]);
  });

  it('phrases a less-spending tip when monthlySpendChangePercent is negative', async () => {
    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary({ monthlySpend: 200, monthlySpendChangePercent: -12.5 }),
    });

    expect(insights).toContain("You're spending 12.5% less than last month — keep going.");
  });

  it('phrases a higher-spending tip when monthlySpendChangePercent is positive', async () => {
    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary({ monthlySpend: 400, monthlySpendChangePercent: 22.0 }),
    });

    expect(insights).toContain('Spending is up 22.0% this month — watch your budget.');
  });

  it('skips the spend tip when there was no spend this month', async () => {
    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary({ monthlySpend: 0, monthlySpendChangePercent: -100 }),
    });

    expect(insights.find(insight => insight.includes('spending'))).toBeUndefined();
  });

  it('skips the spend tip when the change is below the noise threshold', async () => {
    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary({ monthlySpend: 100, monthlySpendChangePercent: 0.2 }),
    });

    expect(insights.find(insight => insight.includes('spending') || insight.includes('Spending'))).toBeUndefined();
  });

  it('surfaces the goal closest to completion (excluding 100% and other currencies)', async () => {
    await seedGoal('emergency', 'Emergency Fund', Currency.USD, 8200, 10000); // 82%
    await seedGoal('laptop', 'New Laptop', Currency.USD, 1100, 2200); // 50%
    await seedGoal('done', 'Old Goal', Currency.USD, 500, 500); // 100% — excluded
    await seedGoal('peso-trip', 'Trip', Currency.Peso, 9000, 10000); // wrong currency

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights).toContain('Emergency Fund is 82% complete.');
  });

  it('skips the goal-progress tip when no active goal has meaningful progress', async () => {
    await seedGoal('idle', 'New Goal', Currency.USD, 100, 10000); // 1%

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights.find(insight => insight.includes('complete'))).toBeUndefined();
  });

  it('reports the goal with the largest spend this month and ignores prior months', async () => {
    await seedGoal('travel', 'Travel Fund', Currency.USD, 3000, 5000);
    await seedGoal('emergency', 'Emergency Fund', Currency.USD, 8200, 10000);
    await seedSpend('s1', 'travel', Currency.USD, 820, new Date(2026, 4, 5));
    await seedSpend('s2', 'emergency', Currency.USD, 200, new Date(2026, 4, 6));
    await seedSpend('s-old', 'emergency', Currency.USD, 5000, MID_LAST_MONTH);

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights.some(insight => insight.startsWith('Your Travel Fund saw the largest spend this month'))).toBe(true);
  });

  it('aggregates multiple spends on the same goal before picking the leader', async () => {
    await seedGoal('travel', 'Travel Fund', Currency.USD, 3000, 5000);
    await seedGoal('emergency', 'Emergency Fund', Currency.USD, 8200, 10000);
    await seedSpend('s-travel-1', 'travel', Currency.USD, 200, new Date(2026, 4, 4));
    await seedSpend('s-travel-2', 'travel', Currency.USD, 200, new Date(2026, 4, 6));
    await seedSpend('s-em', 'emergency', Currency.USD, 350, new Date(2026, 4, 5));

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights.some(insight => insight.startsWith('Your Travel Fund'))).toBe(true);
  });

  it('ignores spends in other currencies when picking the largest', async () => {
    await seedGoal('peso-fund', 'Peso Fund', Currency.Peso, 50000, 100000);
    await seedSpend('s-peso', 'peso-fund', Currency.Peso, 9000, new Date(2026, 4, 4));

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary(),
    });

    expect(insights.find(insight => insight.includes('largest spend'))).toBeUndefined();
  });

  it('returns insights in display order: spend trend, goal progress, largest spend', async () => {
    await seedGoal('emergency', 'Emergency Fund', Currency.USD, 8200, 10000);
    await seedSpend('s', 'emergency', Currency.USD, 200, new Date(2026, 4, 5));

    const insights = await computeDashboardInsights(Currency.USD, {
      now: FIXED_NOW,
      summary: makeSummary({ monthlySpend: 200, monthlySpendChangePercent: -10 }),
    });

    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain('spending 10.0% less');
    expect(insights[1]).toContain('Emergency Fund is 82% complete.');
    expect(insights[2]).toContain('Your Emergency Fund saw the largest spend this month');
  });
});
