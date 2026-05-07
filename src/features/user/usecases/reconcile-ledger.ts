// Rebuilds every row in the document DB (wallet_list, goal_list,
// transaction_list) from the source-of-truth tables in appDB. Used as a
// repair tool when the eagerly-maintained derived data drifts from the
// underlying ledger — and after a JSON import to seed the document DB from
// freshly imported source rows.

import isActiveRow from '@/utils/is-active-row';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import GoalStatus from '@/features/goals/enums/goal-status';
import GoalVersion from '@/features/goals/entities/goal-version';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import currency from 'currency.js';

const COMPLETE_GOAL_NOTE = 'Goal completed';

const latestVersionByGoalID = (versions: GoalVersion[]): Map<string, GoalVersion> => {
  const latest = new Map<string, GoalVersion>();
  for (const version of versions) {
    const current = latest.get(version.goalID);
    const versionTime = version.createdAt?.getTime() ?? 0;
    const currentTime = current?.createdAt?.getTime() ?? -1;
    if (versionTime >= currentTime) latest.set(version.goalID, version);
  }
  return latest;
};

const groupEntriesByTransactionID = (entries: TransactionEntry[]): Map<string, TransactionEntry[]> => {
  const groups = new Map<string, TransactionEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.transactionID) ?? [];
    list.push(entry);
    groups.set(entry.transactionID, list);
  }
  return groups;
};

type ReplayState = {
  walletBalances: Map<string, currency>;
  goalSavedAmounts: Map<string, currency>;
};

const applyWalletDelta = (
  state: ReplayState,
  wallet: Wallet,
  amount: number,
  direction: TransactionDirection,
): void => {
  const current = state.walletBalances.get(wallet.id)
    ?? currencyUtil.parse(0, wallet.currency);
  const next = direction === TransactionDirection.To
    ? current.add(amount)
    : current.subtract(amount);
  state.walletBalances.set(wallet.id, next);
};

const applyGoalDelta = (
  state: ReplayState,
  goalID: string,
  goalCurrency: GoalVersion['currency'],
  amount: number,
  direction: TransactionDirection,
): void => {
  const current = state.goalSavedAmounts.get(goalID)
    ?? currencyUtil.parse(0, goalCurrency);
  const next = direction === TransactionDirection.To
    ? current.add(amount)
    : current.subtract(amount);
  state.goalSavedAmounts.set(goalID, next);
};

type Lookups = {
  walletByID: Map<string, Wallet>;
  goalByID: Map<string, Goal>;
  latestGoalVersion: Map<string, GoalVersion>;
  categoryByID: Map<string, Category>;
};

type ListEntry = {
  type: TransactionSourceType;
  sourceID: string | null;
  name: string | null;
  currency: TransactionEntry['currency'];
  direction: TransactionDirection;
  amount: number;
};

const buildListEntry = (
  entry: TransactionEntry,
  state: ReplayState,
  lookups: Lookups,
  sourceWalletEntry: TransactionEntry | undefined,
): ListEntry => {
  let name: string | null = null;

  if (entry.sourceType === TransactionSourceType.Wallet && entry.sourceID) {
    const wallet = lookups.walletByID.get(entry.sourceID);
    if (wallet) {
      name = wallet.name;
      applyWalletDelta(state, wallet, entry.amount, entry.direction);
    }
  } else if (entry.sourceType === TransactionSourceType.Goal && entry.sourceID) {
    const goal = lookups.goalByID.get(entry.sourceID);
    const version = goal && lookups.latestGoalVersion.get(goal.id);
    if (goal && version) {
      name = version.name;
      applyGoalDelta(state, goal.id, version.currency, entry.amount, entry.direction);
    }
  } else if (entry.sourceType === TransactionSourceType.Internal
    && entry.direction === TransactionDirection.To
    && sourceWalletEntry?.sourceID) {
    // Fee on a convert/transfer — debit the source wallet.
    const wallet = lookups.walletByID.get(sourceWalletEntry.sourceID);
    if (wallet) applyWalletDelta(state, wallet, entry.amount, TransactionDirection.From);
  }

  return {
    type: entry.sourceType,
    sourceID: entry.sourceID,
    name,
    currency: entry.currency,
    direction: entry.direction,
    amount: entry.amount,
  };
};

const replayTransactions = (
  transactions: Transaction[],
  entriesByTransactionID: Map<string, TransactionEntry[]>,
  lookups: Lookups,
) => {
  const state: ReplayState = {
    walletBalances: new Map(),
    goalSavedAmounts: new Map(),
  };
  const listRows = [];

  const sortedTransactions = [...transactions].sort((a, b) =>
    (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

  for (const transaction of sortedTransactions) {
    const entries = entriesByTransactionID.get(transaction.id) ?? [];
    const sourceWalletEntry = entries.find(entry =>
      entry.sourceType === TransactionSourceType.Wallet
      && entry.direction === TransactionDirection.From);

    const listEntries = entries.map(entry =>
      buildListEntry(entry, state, lookups, sourceWalletEntry));

    const category = transaction.categoryID
      ? lookups.categoryByID.get(transaction.categoryID)
      : undefined;

    listRows.push({
      id: transaction.id,
      type: transaction.type,
      notes: transaction.notes,
      entries: listEntries,
      categoryID: category?.id,
      categoryName: category?.name,
      categoryColor: category?.color,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      reversedCreatedAt: transaction.createdAt.getTime() * -1,
    });
  }

  return { state, listRows };
};

const writeWallets = async (
  wallets: Wallet[],
  state: ReplayState,
): Promise<void> => {
  for (const wallet of wallets) {
    const balance = state.walletBalances.get(wallet.id);
    await documentDBUtil.wallet_list.add({
      id: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      currentAmount: balance?.value ?? 0,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }
};

// For pre-migration goals that lack a real statusChangedAt, fall back to the
// closest timestamp we have. Non-Active rows almost certainly transitioned at
// their last mutation, so updatedAt is the best proxy; Active rows never
// transitioned, so createdAt is the truthful answer.
const resolveStatusChangedAt = (goal: Goal): Date | undefined => {
  if (goal.statusChangedAt) return goal.statusChangedAt;
  if (goal.status !== GoalStatus.Active) return goal.updatedAt ?? goal.createdAt;
  return goal.createdAt;
};

const writeGoals = async (
  goals: Goal[],
  latestVersion: Map<string, GoalVersion>,
  state: ReplayState,
): Promise<void> => {
  for (const goal of goals) {
    const version = latestVersion.get(goal.id);
    if (!version) continue;

    const target = currencyUtil.parse(version.targetAmount, version.currency);
    const saved = state.goalSavedAmounts.get(goal.id)
      ?? currencyUtil.parse(0, version.currency);
    const remaining = target.subtract(saved);
    const percentValue = target.value === 0
      ? 0
      : saved.multiply(100).divide(target.value).value;

    await documentDBUtil.goal_list.add({
      id: goal.id,
      versionID: version.id,
      name: version.name,
      targetAmount: target.value,
      savedAmount: saved.value,
      savedPercent: percentValue,
      remainingAmount: remaining.value,
      status: goal.status,
      statusChangedAt: resolveStatusChangedAt(goal),
      currency: version.currency,
      categoryID: version.categoryID,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    });
  }
};

const writeTransactionList = async (
  rows: Awaited<ReturnType<typeof replayTransactions>>['listRows'],
): Promise<void> => {
  for (const row of rows) {
    await documentDBUtil.transaction_list.add(row);
  }
};

// Backfills a draining "Goal completed" Spend for any Completed goal that
// still shows a balance after replay — i.e., goals completed before the
// drain-on-complete behavior shipped. Writes the synthetic spend to appDB so
// the audit log is preserved and future reconciles stay no-op.
const healLegacyCompletedGoals = async (
  goals: Goal[],
  lookups: Lookups,
  state: ReplayState,
  entriesByTransactionID: Map<string, TransactionEntry[]>,
): Promise<{ healed: number; }> => {
  const stale = goals.filter(goal => {
    if (goal.status !== GoalStatus.Completed) return false;
    const saved = state.goalSavedAmounts.get(goal.id);
    return Boolean(saved && saved.value > 0);
  });
  if (stale.length === 0) return { healed: 0 };

  const fallbackCategory = await ensureDefaultCategory();
  // Refresh the lookup so the synthesized spend's category metadata resolves
  // even on a first-ever reconcile that just seeded "Others".
  if (!lookups.categoryByID.has(fallbackCategory.id)) {
    lookups.categoryByID.set(fallbackCategory.id, fallbackCategory);
  }

  const completedAt = (goal: Goal): Date => goal.updatedAt ?? goal.createdAt ?? new Date();

  for (const goal of stale) {
    const version = lookups.latestGoalVersion.get(goal.id);
    if (!version) continue;
    const savedAmount = state.goalSavedAmounts.get(goal.id);
    if (!savedAmount || savedAmount.value <= 0) continue;

    const transactionID = crypto.randomUUID();
    const createdAt = completedAt(goal);
    const fromEntry: TransactionEntry = {
      id: crypto.randomUUID(),
      transactionID,
      sourceType: TransactionSourceType.Goal,
      sourceID: goal.id,
      direction: TransactionDirection.From,
      amount: savedAmount.value,
      currency: version.currency,
      createdAt,
      updatedAt: createdAt,
    };
    const toEntry: TransactionEntry = {
      id: crypto.randomUUID(),
      transactionID,
      sourceType: TransactionSourceType.External,
      sourceID: null,
      direction: TransactionDirection.To,
      amount: savedAmount.value,
      currency: version.currency,
      createdAt,
      updatedAt: createdAt,
    };

    await appDBUtil.transactions.add({
      id: transactionID,
      type: TransactionType.Spend,
      notes: COMPLETE_GOAL_NOTE,
      categoryID: fallbackCategory.id,
      createdAt,
      updatedAt: createdAt,
      deletedAt: 'null',
    });
    await appDBUtil.transaction_entries.add(fromEntry);
    await appDBUtil.transaction_entries.add(toEntry);

    entriesByTransactionID.set(transactionID, [fromEntry, toEntry]);
    applyGoalDelta(state, goal.id, version.currency, savedAmount.value, TransactionDirection.From);
  }

  return { healed: stale.length };
};

const reconcileLedger = async (): Promise<void> => {
  await documentDBUtil.wallet_list.clear();
  await documentDBUtil.goal_list.clear();
  await documentDBUtil.transaction_list.clear();

  const [
    rawWallets, rawGoals, rawGoalVersions,
    rawTransactions, rawTransactionEntries, rawCategories,
  ] = await Promise.all([
    appDBUtil.wallets.toArray(),
    appDBUtil.goals.toArray(),
    appDBUtil.goal_versions.toArray(),
    appDBUtil.transactions.toArray(),
    appDBUtil.transaction_entries.toArray(),
    appDBUtil.categories.toArray(),
  ]);

  const wallets = rawWallets.filter(isActiveRow);
  const goals = rawGoals.filter(isActiveRow);
  const goalVersions = rawGoalVersions.filter(isActiveRow);
  const transactions = rawTransactions.filter(isActiveRow);
  const transactionEntries = rawTransactionEntries.filter(isActiveRow);
  const categories = rawCategories.filter(isActiveRow);

  const lookups: Lookups = {
    walletByID: new Map(wallets.map(wallet => [wallet.id, wallet])),
    goalByID: new Map(goals.map(goal => [goal.id, goal])),
    latestGoalVersion: latestVersionByGoalID(goalVersions),
    categoryByID: new Map(categories.map(category => [category.id, category])),
  };

  const entriesByTransactionID = groupEntriesByTransactionID(transactionEntries);
  const firstPass = replayTransactions(transactions, entriesByTransactionID, lookups);

  // Heal goals completed before the drain-on-complete behavior shipped — they
  // still carry a saved balance because no Spend was ever written. After
  // backfilling synthetic spends into appDB, replay again so the listRows
  // include them and the running state reflects the drain.
  const { healed } = await healLegacyCompletedGoals(
    goals, lookups, firstPass.state, entriesByTransactionID);

  let final = firstPass;
  if (healed > 0) {
    const refreshedTransactions = (await appDBUtil.transactions.toArray()).filter(isActiveRow);
    final = replayTransactions(refreshedTransactions, entriesByTransactionID, lookups);
  }

  await writeWallets(wallets, final.state);
  await writeGoals(goals, lookups.latestGoalVersion, final.state);
  await writeTransactionList(final.listRows);
};

export default reconcileLedger;
