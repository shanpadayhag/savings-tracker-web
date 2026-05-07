import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import computeDashboardSummary from '@/features/dashboard/api/compute-dashboard-summary';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const FIXED_NOW = new Date(2026, 4, 15, 12, 0, 0); // 2026-05-15 12:00 (Friday)
const START_OF_THIS_MONTH = new Date(2026, 4, 1);
const MID_LAST_MONTH = new Date(2026, 3, 14);
const TWO_MONTHS_AGO = new Date(2026, 2, 10);

const seedWallet = async (
  id: string,
  currency: Currency,
  currentAmount: number,
) => {
  await documentDBFake.wallet_list.add({
    id,
    name: `Wallet ${id}`,
    currency,
    currentAmount,
    createdAt: TWO_MONTHS_AGO,
    updatedAt: FIXED_NOW,
  });
};

const seedGoal = async (
  id: string,
  currency: Currency,
  savedAmount: number,
  targetAmount = 10000,
) => {
  await documentDBFake.goal_list.add({
    id,
    versionID: `${id}-v1`,
    name: `Goal ${id}`,
    targetAmount,
    savedAmount,
    savedPercent: targetAmount === 0 ? 0 : (savedAmount / targetAmount) * 100,
    remainingAmount: targetAmount - savedAmount,
    status: GoalStatus.Active,
    currency,
    createdAt: TWO_MONTHS_AGO,
    updatedAt: FIXED_NOW,
  });
};

type EntryInput = {
  type: TransactionSourceType;
  sourceID: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
  name?: string | null;
};

const seedTransaction = async (
  id: string,
  type: TransactionType,
  createdAt: Date,
  entries: EntryInput[],
) => {
  await documentDBFake.transaction_list.add({
    id,
    type,
    notes: null,
    entries: entries.map(entry => ({
      type: entry.type,
      sourceID: entry.sourceID,
      name: entry.name ?? null,
      currency: entry.currency,
      direction: entry.direction,
      amount: entry.amount,
    })),
    createdAt,
    updatedAt: createdAt,
  });
};

describe('computeDashboardSummary', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('sums wallets + goals into net worth, scoped to the active currency', async () => {
    await seedWallet('usd-checking', Currency.USD, 1000);
    await seedWallet('usd-savings', Currency.USD, 500);
    await seedWallet('peso-cash', Currency.Peso, 99999);
    await seedGoal('usd-emergency', Currency.USD, 2000);
    await seedGoal('peso-trip', Currency.Peso, 50000);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.walletsBalance).toBe(1500);
    expect(summary.goalsBalance).toBe(2000);
    expect(summary.netWorth).toBe(3500);
  });

  it('returns zero values when no records exist', async () => {
    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary).toMatchObject({
      netWorth: 0,
      netWorthChangePercent: 0,
      walletsBalance: 0,
      walletsBalanceChangePercent: 0,
      goalsBalance: 0,
      goalsBalanceChangePercent: 0,
      monthlySpend: 0,
      monthlySpendChangePercent: 0,
    });
  });

  it('treats spend transactions in the current month as monthlySpend', async () => {
    await seedGoal('emergency', Currency.USD, 800);

    await seedTransaction('spend-this-month', TransactionType.Spend,
      new Date(2026, 4, 5), [
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 120 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 120 },
    ]);

    await seedTransaction('spend-last-month', TransactionType.Spend,
      MID_LAST_MONTH, [
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 50 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 50 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.monthlySpend).toBe(120);
  });

  it('computes monthlySpendChangePercent against the prior month spend', async () => {
    await seedGoal('emergency', Currency.USD, 1000);

    await seedTransaction('spend-this-month', TransactionType.Spend,
      new Date(2026, 4, 3), [
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 80 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 80 },
    ]);

    await seedTransaction('spend-last-month', TransactionType.Spend,
      new Date(2026, 3, 20), [
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.monthlySpend).toBe(80);
    // (80 - 100) / 100 * 100 = -20
    expect(summary.monthlySpendChangePercent).toBe(-20);
  });

  it('counts wallet-sourced spends in monthlySpend (not just goal-sourced)', async () => {
    // Regression: previously the dashboard only summed Spend rows where the
    // From entry matched any source — but the spending-by-category and
    // reports rules need wallet-sourced spends counted too. After unifying,
    // the dashboard's "Monthly Spend" now agrees with reports' Total Expense.
    await seedWallet('checking', Currency.USD, 1000);

    await seedTransaction('wallet-spend', TransactionType.Spend, new Date(2026, 4, 6), [
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 65 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 65 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.monthlySpend).toBe(65);
  });

  it('counts cross-currency convert source amount + fee as monthlySpend on the source currency', async () => {
    // Symmetric with the income-on-destination rule: USD loses 100 to PESO's
    // books — outflow from USD's ledger — and the $2 fee is also expense.
    // Total USD monthlySpend = $102. (Dashboard mirrors reports' Total
    // Expense exactly.)
    await seedWallet('usd', Currency.USD, 500);
    await seedWallet('peso', Currency.Peso, 0);

    await seedTransaction('convert', TransactionType.Convert, new Date(2026, 4, 8), [
      { type: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
      { type: TransactionSourceType.Internal, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
    ]);

    const usdSummary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });
    const pesoSummary = await computeDashboardSummary(Currency.Peso, { now: FIXED_NOW });

    expect(usdSummary.monthlySpend).toBe(102);
    expect(pesoSummary.monthlySpend).toBe(0);
  });

  it('includes convert/transfer fees in monthlySpend (parity with reports)', async () => {
    // Regression: dashboard previously skipped non-Spend transactions entirely
    // when summing Monthly Spend, so a $5 transfer fee never showed up as
    // expense even though the reports' Total Expense bar counted it.
    await seedWallet('a', Currency.USD, 500);
    await seedWallet('b', Currency.USD, 500);

    await seedTransaction('transfer-with-fee', TransactionType.Transfer, new Date(2026, 4, 7), [
      { type: TransactionSourceType.Wallet, sourceID: 'a', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'b', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      { type: TransactionSourceType.Internal, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.monthlySpend).toBe(5);
  });

  it('includes back-dated same-day spends after `now` in monthlySpend', async () => {
    // Regression: when the upper bound was `now` (e.g. noon today), a spend
    // dated to 6pm today was excluded from monthlySpend even though it's
    // clearly part of this month. The fix uses startOfNextMonth as the
    // upper bound.
    await seedGoal('emergency', Currency.USD, 1000);

    await seedTransaction('spend-this-evening', TransactionType.Spend,
      new Date(2026, 4, 15, 18, 0, 0), [
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 30 },
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 30 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.monthlySpend).toBe(30);
  });

  it('reconstructs start-of-month wallet balance by reversing this month deltas', async () => {
    // Wallet currently 1500. This month: +500 allocation, -100 spend.
    // So start-of-month balance should be 1500 - 400 = 1100.
    await seedWallet('checking', Currency.USD, 1500);

    await seedTransaction('allocate-this-month', TransactionType.Allocate,
      new Date(2026, 4, 2), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);

    await seedTransaction('allocate-to-goal-this-month', TransactionType.Allocate,
      new Date(2026, 4, 3), [
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Goal, sourceID: 'g', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.walletsBalance).toBe(1500);
    // (1500 - 1100) / 1100 * 100 ≈ 36.36...
    expect(summary.walletsBalanceChangePercent).toBeCloseTo(36.3636, 2);
  });

  it('attributes convert/transfer fees to the source wallet outflow', async () => {
    // Source wallet now sits at 800. This month it sent a 200 transfer
    // with a 5 fee. Pre-month balance was 800 + 200 + 5 = 1005.
    await seedWallet('source', Currency.USD, 800);
    await seedWallet('destination', Currency.USD, 200);

    await seedTransaction('transfer-with-fee', TransactionType.Transfer,
      new Date(2026, 4, 4), [
      { type: TransactionSourceType.Wallet, sourceID: 'source', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Wallet, sourceID: 'destination', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      { type: TransactionSourceType.Internal, sourceID: null, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    // Total wallets balance = 800 + 200 = 1000. Pre-month = 1000 + (5 fee net) = 1005.
    // Source took 200 out + 5 fee, destination got 200. Net change in this currency = -5.
    // Pre-month wallets balance = 1000 - (-5) = 1005.
    expect(summary.walletsBalance).toBe(1000);
    expect(summary.walletsBalanceChangePercent).toBeCloseTo(((1000 - 1005) / 1005) * 100, 4);
  });

  it('ignores entries in other currencies when computing deltas', async () => {
    await seedWallet('usd', Currency.USD, 1000);
    await seedWallet('peso', Currency.Peso, 50000);

    await seedTransaction('peso-allocate-this-month', TransactionType.Allocate,
      new Date(2026, 4, 6), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.Peso, direction: TransactionDirection.From, amount: 5000 },
      { type: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5000 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.walletsBalance).toBe(1000);
    // No USD activity this month → start-of-month equals current, so 0% change.
    expect(summary.walletsBalanceChangePercent).toBe(0);
  });

  it('computes goal change% from goal-targeted entries this month', async () => {
    // Goal currently 600. Allocated 200 this month → start-of-month was 400.
    await seedGoal('emergency', Currency.USD, 600);

    await seedTransaction('allocate-to-goal', TransactionType.Allocate,
      new Date(2026, 4, 7), [
      { type: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.goalsBalance).toBe(600);
    // (600 - 400) / 400 * 100 = 50
    expect(summary.goalsBalanceChangePercent).toBe(50);
  });

  it('returns 0% change when previous value is zero (avoids divide-by-zero)', async () => {
    // Wallet was 0 at start of month, then funded with 250 mid-month.
    await seedWallet('new', Currency.USD, 250);
    await seedTransaction('funded-this-month', TransactionType.Allocate,
      new Date(2026, 4, 10), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 250 },
      { type: TransactionSourceType.Wallet, sourceID: 'new', currency: Currency.USD, direction: TransactionDirection.To, amount: 250 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.walletsBalance).toBe(250);
    expect(summary.walletsBalanceChangePercent).toBe(0);
  });

  it('rolls up netWorth change from wallets + goals together', async () => {
    // Now: wallet 1500 + goal 600 = 2100.
    // This month deltas: wallet +500 (allocation), -200 (two goal allocations);
    // goal +200 (the same two allocations land in the goal).
    // Wallet net change = +300, goal net change = +200.
    // Start of month: wallet 1200, goal 400 → net worth 1600.
    // (2100 - 1600) / 1600 * 100 = 31.25.
    await seedWallet('checking', Currency.USD, 1500);
    await seedGoal('emergency', Currency.USD, 600);

    await seedTransaction('allocate-wallet', TransactionType.Allocate,
      new Date(2026, 4, 2), [
      { type: TransactionSourceType.External, sourceID: null, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
    ]);

    await seedTransaction('allocate-to-goal', TransactionType.Allocate,
      new Date(2026, 4, 3), [
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    await seedTransaction('allocate-to-goal-2', TransactionType.Allocate,
      new Date(2026, 4, 6), [
      { type: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
      { type: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
    ]);

    const summary = await computeDashboardSummary(Currency.USD, { now: FIXED_NOW });

    expect(summary.netWorth).toBe(2100);
    expect(summary.netWorthChangePercent).toBe(31.25);
  });
});
