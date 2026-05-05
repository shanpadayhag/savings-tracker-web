import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (id: string, name: string, currency: Currency, deletedAt: Date | 'null' = 'null') => {
  await appDBFake.wallets.add({
    id, name, currency,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt,
  });
};

const seedGoal = async (
  id: string,
  versions: { versionID: string; name: string; targetAmount: number; createdAt: Date; }[],
  currency: Currency,
  status: GoalStatus = GoalStatus.Active,
) => {
  await appDBFake.goals.add({
    id, status,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: 'null',
  });
  for (const version of versions) {
    await appDBFake.goal_versions.add({
      id: version.versionID, goalID: id,
      name: version.name, targetAmount: version.targetAmount,
      currency,
      createdAt: version.createdAt,
      deletedAt: 'null',
    });
  }
};

type EntryInput = {
  transactionID: string;
  sourceType: TransactionSourceType;
  sourceID?: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

const seedTransaction = async (params: {
  id: string;
  type: TransactionType;
  createdAt: Date;
  notes?: string | null;
  categoryID?: string;
  entries: Omit<EntryInput, 'transactionID'>[];
}) => {
  await appDBFake.transactions.add({
    id: params.id, type: params.type,
    notes: params.notes ?? null,
    categoryID: params.categoryID,
    createdAt: params.createdAt, updatedAt: params.createdAt,
    deletedAt: 'null',
  });
  for (const [index, entry] of params.entries.entries()) {
    await appDBFake.transaction_entries.add({
      id: `${params.id}-e${index}`,
      transactionID: params.id,
      sourceType: entry.sourceType,
      sourceID: entry.sourceID ?? null,
      direction: entry.direction,
      amount: entry.amount,
      currency: entry.currency,
      createdAt: params.createdAt, updatedAt: params.createdAt,
      deletedAt: 'null',
    });
  }
};

describe('reconcileLedger', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('rebuilds wallet balance from external→wallet allocations', async () => {
    await seedWallet('checking', 'Checking', Currency.USD);
    await seedTransaction({
      id: 't1', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 5),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1500 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.To, amount: 1500 },
      ],
    });

    await reconcileLedger();

    const wallet = await documentDBFake.wallet_list.get('checking');
    expect(wallet?.currentAmount).toBe(1500);
  });

  it('rebuilds wallet balance after a same-currency transfer with fee (fee debits source)', async () => {
    await seedWallet('source', 'Source', Currency.USD);
    await seedWallet('destination', 'Destination', Currency.USD);
    await seedTransaction({
      id: 't1', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 1000 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'source', currency: Currency.USD, direction: TransactionDirection.To, amount: 1000 },
      ],
    });
    await seedTransaction({
      id: 't2', type: TransactionType.Transfer, createdAt: new Date(2026, 4, 2),
      entries: [
        { sourceType: TransactionSourceType.Wallet, sourceID: 'source', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'destination', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
        { sourceType: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 5 },
      ],
    });

    await reconcileLedger();

    const source = await documentDBFake.wallet_list.get('source');
    const destination = await documentDBFake.wallet_list.get('destination');
    expect(source?.currentAmount).toBe(795);
    expect(destination?.currentAmount).toBe(200);
  });

  it('rebuilds wallet balances across a cross-currency convert with fee', async () => {
    await seedWallet('usd', 'USD Wallet', Currency.USD);
    await seedWallet('peso', 'Peso Wallet', Currency.Peso);
    await seedTransaction({
      id: 'seed-usd', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
      ],
    });
    await seedTransaction({
      id: 'convert', type: TransactionType.Convert, createdAt: new Date(2026, 4, 5),
      entries: [
        { sourceType: TransactionSourceType.Wallet, sourceID: 'usd', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'peso', currency: Currency.Peso, direction: TransactionDirection.To, amount: 5500 },
        { sourceType: TransactionSourceType.Internal, currency: Currency.USD, direction: TransactionDirection.To, amount: 2 },
      ],
    });

    await reconcileLedger();

    const usd = await documentDBFake.wallet_list.get('usd');
    const peso = await documentDBFake.wallet_list.get('peso');
    // 500 - (100 + 2) = 398 USD; +5500 PHP
    expect(usd?.currentAmount).toBe(398);
    expect(peso?.currentAmount).toBe(5500);
  });

  it('rebuilds goal saved/percent/remaining from allocations and spends', async () => {
    await seedWallet('checking', 'Checking', Currency.USD);
    await seedGoal('emergency', [{ versionID: 'v1', name: 'Emergency Fund', targetAmount: 1000, createdAt: new Date(2026, 0, 1) }], Currency.USD);
    await seedTransaction({
      id: 'alloc', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.Wallet, sourceID: 'checking', currency: Currency.USD, direction: TransactionDirection.From, amount: 600 },
        { sourceType: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.To, amount: 600 },
      ],
    });
    await seedTransaction({
      id: 'spend', type: TransactionType.Spend, createdAt: new Date(2026, 4, 5),
      entries: [
        { sourceType: TransactionSourceType.Goal, sourceID: 'emergency', currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
      ],
    });

    await reconcileLedger();

    const goal = await documentDBFake.goal_list.get('emergency');
    expect(goal?.savedAmount).toBe(500);
    expect(goal?.savedPercent).toBe(50);
    expect(goal?.remainingAmount).toBe(500);
  });

  it('uses the latest goal version (after a rename and target change)', async () => {
    await seedGoal('emergency', [
      { versionID: 'v1', name: 'Emergency', targetAmount: 1000, createdAt: new Date(2026, 0, 1) },
      { versionID: 'v2', name: 'Rainy Day Fund', targetAmount: 2000, createdAt: new Date(2026, 3, 1) },
    ], Currency.USD);

    await reconcileLedger();

    const goal = await documentDBFake.goal_list.get('emergency');
    expect(goal?.name).toBe('Rainy Day Fund');
    expect(goal?.targetAmount).toBe(2000);
    expect(goal?.versionID).toBe('v2');
  });

  it('preserves category metadata on transaction_list rows', async () => {
    await appDBFake.categories.add({
      id: 'groceries', name: 'Groceries', color: '#00ff00',
      isSystem: false,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
      deletedAt: 'null',
    });
    await seedGoal('food', [{ versionID: 'v1', name: 'Food', targetAmount: 500, createdAt: new Date(2026, 0, 1) }], Currency.USD);
    await seedTransaction({
      id: 'spend', type: TransactionType.Spend, createdAt: new Date(2026, 4, 5),
      categoryID: 'groceries',
      entries: [
        { sourceType: TransactionSourceType.Goal, sourceID: 'food', currency: Currency.USD, direction: TransactionDirection.From, amount: 80 },
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 80 },
      ],
    });

    await reconcileLedger();

    const row = (await documentDBFake.transaction_list.toArray())[0];
    expect(row.categoryID).toBe('groceries');
    expect(row.categoryName).toBe('Groceries');
    expect(row.categoryColor).toBe('#00ff00');
  });

  it('processes transactions chronologically', async () => {
    await seedWallet('w', 'Wallet', Currency.USD);
    await seedTransaction({
      id: 'late', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 10),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 50 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 50 },
      ],
    });
    await seedTransaction({
      id: 'early', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
      ],
    });

    await reconcileLedger();

    const rows = await documentDBFake.transaction_list.toArray();
    expect(rows.map(row => row.id)).toEqual(['early', 'late']);

    const wallet = await documentDBFake.wallet_list.get('w');
    expect(wallet?.currentAmount).toBe(150);
  });

  it('skips deleted wallets, goals, and transactions', async () => {
    await seedWallet('active', 'Active', Currency.USD);
    await seedWallet('deleted', 'Deleted', Currency.USD, new Date(2026, 4, 1));
    await seedTransaction({
      id: 'good', type: TransactionType.Allocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 100 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'active', currency: Currency.USD, direction: TransactionDirection.To, amount: 100 },
      ],
    });
    // Soft-deleted transaction shouldn't influence balances.
    await appDBFake.transactions.add({
      id: 'deleted-tx', type: TransactionType.Allocate,
      notes: null,
      createdAt: new Date(2026, 4, 2), updatedAt: new Date(2026, 4, 2),
      deletedAt: new Date(2026, 4, 3),
    });

    await reconcileLedger();

    const active = await documentDBFake.wallet_list.get('active');
    const deleted = await documentDBFake.wallet_list.get('deleted');
    expect(active?.currentAmount).toBe(100);
    expect(deleted).toBeUndefined();

    const rows = await documentDBFake.transaction_list.toArray();
    expect(rows.map(row => row.id)).toEqual(['good']);
  });

  it('handles a goal with no version gracefully (skips the goal)', async () => {
    await appDBFake.goals.add({
      id: 'orphan', status: GoalStatus.Active,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
      deletedAt: 'null',
    });

    await reconcileLedger();

    const goal = await documentDBFake.goal_list.get('orphan');
    expect(goal).toBeUndefined();
  });

  it('avoids divide-by-zero when computing savedPercent for a 0-target goal', async () => {
    await seedGoal('quirky', [{ versionID: 'v1', name: 'Quirky', targetAmount: 0, createdAt: new Date(2026, 0, 1) }], Currency.USD);

    await reconcileLedger();

    const goal = await documentDBFake.goal_list.get('quirky');
    expect(goal?.savedPercent).toBe(0);
  });

  it('heals legacy completed goals by backfilling a "Goal completed" Spend', async () => {
    // Legacy state: a goal that was funded and then completed via the old
    // status-only flow (no draining spend). After reconcile, the goal should
    // be drained and a Spend transaction should be backfilled.
    await seedGoal('legacy', [{
      versionID: 'v1', name: 'Legacy Goal', targetAmount: 1000,
      createdAt: new Date(2026, 0, 1),
    }], Currency.USD, GoalStatus.Completed);
    await appDBFake.goals.update('legacy', { updatedAt: new Date(2026, 4, 10) });
    await seedTransaction({
      id: 'fund', type: TransactionType.Allocate, createdAt: new Date(2026, 3, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 800 },
        { sourceType: TransactionSourceType.Goal, sourceID: 'legacy', currency: Currency.USD, direction: TransactionDirection.To, amount: 800 },
      ],
    });

    await reconcileLedger();

    const goal = await documentDBFake.goal_list.get('legacy');
    expect(goal?.savedAmount).toBe(0);

    const transactions = appDBFake.transactions.list();
    const synthetic = transactions.find(transaction =>
      transaction.notes === 'Goal completed' && transaction.type === TransactionType.Spend);
    expect(synthetic).toBeDefined();
    expect(synthetic?.createdAt?.getTime()).toBe(new Date(2026, 4, 10).getTime());

    const entries = appDBFake.transaction_entries.list()
      .filter(entry => entry.transactionID === synthetic?.id);
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Goal,
      sourceID: 'legacy',
      amount: 800,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      amount: 800,
    });
  });

  it('does not heal goals already drained by the new complete-goal flow', async () => {
    await seedGoal('proper', [{
      versionID: 'v1', name: 'Proper Goal', targetAmount: 1000,
      createdAt: new Date(2026, 0, 1),
    }], Currency.USD, GoalStatus.Completed);
    await seedTransaction({
      id: 'fund', type: TransactionType.Allocate, createdAt: new Date(2026, 3, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 800 },
        { sourceType: TransactionSourceType.Goal, sourceID: 'proper', currency: Currency.USD, direction: TransactionDirection.To, amount: 800 },
      ],
    });
    await seedTransaction({
      id: 'drain', type: TransactionType.Spend, createdAt: new Date(2026, 4, 5),
      notes: 'Goal completed',
      entries: [
        { sourceType: TransactionSourceType.Goal, sourceID: 'proper', currency: Currency.USD, direction: TransactionDirection.From, amount: 800 },
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.To, amount: 800 },
      ],
    });

    await reconcileLedger();

    const transactions = appDBFake.transactions.list();
    const completionSpends = transactions.filter(transaction =>
      transaction.notes === 'Goal completed');
    expect(completionSpends).toHaveLength(1);
  });

  it('heals on the first reconcile and stays no-op on subsequent reconciles', async () => {
    await seedGoal('legacy', [{
      versionID: 'v1', name: 'Legacy', targetAmount: 1000,
      createdAt: new Date(2026, 0, 1),
    }], Currency.USD, GoalStatus.Completed);
    await seedTransaction({
      id: 'fund', type: TransactionType.Allocate, createdAt: new Date(2026, 3, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 500 },
        { sourceType: TransactionSourceType.Goal, sourceID: 'legacy', currency: Currency.USD, direction: TransactionDirection.To, amount: 500 },
      ],
    });

    await reconcileLedger();
    await reconcileLedger();

    const completionSpends = appDBFake.transactions.list()
      .filter(transaction => transaction.notes === 'Goal completed');
    expect(completionSpends).toHaveLength(1);

    const goal = await documentDBFake.goal_list.get('legacy');
    expect(goal?.savedAmount).toBe(0);
  });

  it('leaves archived goals alone (their Deallocate already drained the balance)', async () => {
    await seedWallet('w', 'Wallet', Currency.USD);
    await seedGoal('archived', [{
      versionID: 'v1', name: 'Archived', targetAmount: 1000,
      createdAt: new Date(2026, 0, 1),
    }], Currency.USD, GoalStatus.Archived);
    await seedTransaction({
      id: 'fund', type: TransactionType.Allocate, createdAt: new Date(2026, 3, 1),
      entries: [
        { sourceType: TransactionSourceType.External, currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
        { sourceType: TransactionSourceType.Goal, sourceID: 'archived', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      ],
    });
    await seedTransaction({
      id: 'dealloc', type: TransactionType.Deallocate, createdAt: new Date(2026, 4, 1),
      entries: [
        { sourceType: TransactionSourceType.Goal, sourceID: 'archived', currency: Currency.USD, direction: TransactionDirection.From, amount: 200 },
        { sourceType: TransactionSourceType.Wallet, sourceID: 'w', currency: Currency.USD, direction: TransactionDirection.To, amount: 200 },
      ],
    });

    await reconcileLedger();

    const completionSpends = appDBFake.transactions.list()
      .filter(transaction => transaction.notes === 'Goal completed');
    expect(completionSpends).toHaveLength(0);
  });

  it('clears document tables before rebuilding so stale rows do not survive', async () => {
    await documentDBFake.wallet_list.add({
      id: 'stale', name: 'Stale', currency: Currency.USD, currentAmount: 9999,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
    });

    await reconcileLedger();

    const wallet = await documentDBFake.wallet_list.get('stale');
    expect(wallet).toBeUndefined();
  });
});
