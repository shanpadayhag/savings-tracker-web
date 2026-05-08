import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import { isSameDay } from 'date-fns';

type CancelTransactionParams = {
  transactionID: Transaction['id'];
  /** Override the cancellation timestamp — primarily for tests. Defaults to
   * `new Date()`. The same calendar day as `original.createdAt` triggers a
   * soft cancel; otherwise an offsetting reversal entry is appended. */
  cancelledAt?: Date;
};

const CANCELLABLE_TYPES = new Set<TransactionType>([
  TransactionType.Spend,
  TransactionType.Transfer,
  TransactionType.Convert,
]);

const flipDirection = (direction: TransactionDirection): TransactionDirection =>
  direction === TransactionDirection.From
    ? TransactionDirection.To
    : TransactionDirection.From;

const updateWalletBalance = async (
  walletID: string,
  delta: number,
): Promise<void> => {
  const wallet = await documentDBUtil.wallet_list.get(walletID);
  if (!wallet) return;
  const current = currencyUtil.parse(wallet.currentAmount, wallet.currency);
  await documentDBUtil.wallet_list.update(walletID, {
    currentAmount: current.add(delta).value,
  });
};

const updateGoalBalance = async (
  goalID: string,
  delta: number,
): Promise<void> => {
  const goal = await documentDBUtil.goal_list.get(goalID);
  if (!goal) return;
  const target = currencyUtil.parse(goal.targetAmount, goal.currency);
  const newSaved = currencyUtil.parse(goal.savedAmount, goal.currency).add(delta);
  const remaining = target.subtract(newSaved);
  // Mirror the reconciler / allocators on zero-target goals: emit 0% rather
  // than NaN/Infinity. A cancelled spend can also push savedAmount above
  // targetAmount (per the product decision: "nothing we can do about it") —
  // savedPercent over 100 is allowed.
  const savedPercent = target.value === 0
    ? 0
    : newSaved.multiply(100).divide(target).value;
  await documentDBUtil.goal_list.update(goalID, {
    savedAmount: newSaved.value,
    remainingAmount: remaining.value,
    savedPercent,
  });
};

// Apply the inverse of the original transaction's entries to wallet_list /
// goal_list balances. Used by both soft-cancel and reverse — in both cases the
// net visible balance changes the same way; the difference is whether we also
// append a reversal row to the audit log.
const applyEntriesInverse = async (entries: TransactionEntry[]): Promise<void> => {
  const sourceWalletEntry = entries.find(entry =>
    entry.sourceType === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.From);

  for (const entry of entries) {
    if (entry.sourceType === TransactionSourceType.External) continue;

    if (entry.sourceType === TransactionSourceType.Internal) {
      // Fees on transfer/convert debit the source wallet on the original; the
      // inverse credits it back. No-op if there's no wallet source (defensive
      // — the existing fee-emitting paths always have one).
      if (entry.direction !== TransactionDirection.To) continue;
      if (!sourceWalletEntry?.sourceID) continue;
      await updateWalletBalance(sourceWalletEntry.sourceID, entry.amount);
      continue;
    }

    if (!entry.sourceID) continue;
    const inverse = flipDirection(entry.direction);
    const delta = inverse === TransactionDirection.To ? entry.amount : -entry.amount;
    if (entry.sourceType === TransactionSourceType.Wallet) {
      await updateWalletBalance(entry.sourceID, delta);
    } else if (entry.sourceType === TransactionSourceType.Goal) {
      await updateGoalBalance(entry.sourceID, delta);
    }
  }
};

const ensureGoalsCancellable = async (entries: TransactionEntry[]): Promise<void> => {
  const goalIDs = new Set<string>();
  for (const entry of entries) {
    if (entry.sourceType === TransactionSourceType.Goal && entry.sourceID) {
      goalIDs.add(entry.sourceID);
    }
  }

  for (const goalID of goalIDs) {
    const goal = await appDBUtil.goals.get(goalID);
    if (!goal) continue;
    if (goal.status === GoalStatus.Completed) {
      throw new AppError(
        "Goal Completed 🏁",
        "This transaction belongs to a goal that's been completed. Cancellation isn't available."
      );
    }
    if (goal.status === GoalStatus.Archived) {
      throw new AppError(
        "Goal Archived 📦",
        "This transaction belongs to a goal that's been archived. Cancellation isn't available."
      );
    }
  }
};

const applyReverseEntry = async (
  original: Transaction,
  entries: TransactionEntry[],
  cancelledAt: Date,
): Promise<void> => {
  // The reversal is its own transaction dated on the cancel day, with each
  // entry's direction flipped. Amounts are reused verbatim — for FX converts
  // this preserves the original rate (per product decision) so the user
  // doesn't gain or lose money to today's market.
  const reversalID = crypto.randomUUID();
  const reversalEntries: TransactionEntry[] = entries.map(entry => ({
    id: crypto.randomUUID(),
    transactionID: reversalID,
    sourceType: entry.sourceType,
    sourceID: entry.sourceID,
    direction: flipDirection(entry.direction),
    amount: entry.amount,
    currency: entry.currency,
    createdAt: cancelledAt,
    updatedAt: cancelledAt,
  }));

  const reversalNotes = original.notes
    ? `Reversal of "${original.notes}"`
    : `Reversal of #${original.id.slice(0, 8).toUpperCase()}`;

  await appDBUtil.transactions.add({
    id: reversalID,
    type: original.type,
    notes: reversalNotes,
    categoryID: original.categoryID,
    reversalOfID: original.id,
    createdAt: cancelledAt,
    updatedAt: cancelledAt,
  });
  for (const entry of reversalEntries) {
    await appDBUtil.transaction_entries.add(entry);
  }

  // Mirror onto the projection so the UI sees both the reversal row and the
  // updated metadata on the original.
  const originalProjection = await documentDBUtil.transaction_list.get(original.id);
  await documentDBUtil.transaction_list.add({
    id: reversalID,
    type: original.type,
    notes: reversalNotes,
    entries: reversalEntries.map(entry => {
      const matchingOriginal = originalProjection?.entries.find(p =>
        p.sourceID === entry.sourceID
        && p.type === entry.sourceType
        && p.direction === flipDirection(entry.direction));
      return {
        type: entry.sourceType,
        sourceID: entry.sourceID,
        name: matchingOriginal?.name ?? null,
        currency: entry.currency,
        direction: entry.direction,
        amount: entry.amount,
      };
    }),
    categoryID: originalProjection?.categoryID,
    categoryName: originalProjection?.categoryName,
    categoryColor: originalProjection?.categoryColor,
    reversalOfID: original.id,
    createdAt: cancelledAt,
    updatedAt: cancelledAt,
    reversedCreatedAt: cancelledAt.getTime() * -1,
  });

  await appDBUtil.transactions.update(original.id, { reversedAt: cancelledAt });
  await documentDBUtil.transaction_list.update(original.id, { reversedAt: cancelledAt });

  await applyEntriesInverse(entries);
};

const applySoftCancel = async (
  original: Transaction,
  entries: TransactionEntry[],
  cancelledAt: Date,
): Promise<void> => {
  await appDBUtil.transactions.update(original.id, { cancelledAt });
  await documentDBUtil.transaction_list.update(original.id, { cancelledAt });
  await applyEntriesInverse(entries);
};

const cancelTransaction = async (params: CancelTransactionParams): Promise<void> => {
  const original = await appDBUtil.transactions.get(params.transactionID);
  if (!original) throw new AppError(
    "Transaction Not Found 🔍",
    "We couldn't find this transaction. It may have been deleted. Please refresh your list."
  );

  if (original.cancelledAt) throw new AppError(
    "Already Cancelled",
    "This transaction has already been cancelled."
  );
  if (original.reversedAt) throw new AppError(
    "Already Reversed",
    "This transaction has already been reversed by a later entry."
  );
  if (original.reversalOfID) throw new AppError(
    "Reversal Entry",
    "This is a reversal of another transaction — you can't cancel a cancellation."
  );

  if (!CANCELLABLE_TYPES.has(original.type)) throw new AppError(
    "Can't Cancel This Type 🚫",
    "Allocations and deallocations can't be cancelled. Only spends, transfers, and conversions are reversible."
  );

  const allEntries = await appDBUtil.transaction_entries.toArray();
  const entries = allEntries.filter(entry => entry.transactionID === original.id);

  await ensureGoalsCancellable(entries);

  const cancelledAt = params.cancelledAt ?? new Date();
  const sameDay = isSameDay(original.createdAt, cancelledAt);

  if (sameDay) {
    await applySoftCancel(original, entries, cancelledAt);
  } else {
    await applyReverseEntry(original, entries, cancelledAt);
  }
};

export default cancelTransaction;
