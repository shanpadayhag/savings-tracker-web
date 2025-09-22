import GoalListItem from '@/features/goals/entities/goal-list-item';
import type ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import type TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import { db } from '@/lib/utils';

const TRANSACTION_FETCH_LIMIT = 250000;

/**
 * Transforms a raw transaction chunk into an export-ready format by embedding associated goal details.
 *
 * This function acts as a critical data-shaping step in the export process. It
 * optimizes performance by first collecting all unique goal IDs from the provided
 * transactions, then fetching the corresponding `Goal` objects in a single, batched
 * database query. The enriched data is then efficiently mapped back to each transaction.
 *
 * @private
 * @param {TransactionListItem[]} transactions - A chunk of raw transaction records fetched from the database.
 * @returns {Promise<ExportedTransactionListItem[]>} A promise that resolves to an array of transactions where
 *   each `goalActivity`, if present, has been populated with the full details of its associated goal.
 */
const enrichTransactionsWithGoalData = async (
  transactions: TransactionListItem[],
): Promise<ExportedTransactionListItem[]> => {
  const goalIds = [
    ...new Set(transactions.map(t => t.goalActivity?.goalID).filter((id): id is string => !!id)),
  ];

  const goals = await db.goalList.where('id').anyOf(goalIds).toArray();
  const goalLookup = new Map<string, GoalListItem>(goals.map(goal => [goal.id!, goal]));

  return transactions.map(transaction => {
    const { goalActivity, ...restOfTransaction } = transaction;
    if (!goalActivity?.goalID) return restOfTransaction;

    const goal = goalLookup.get(goalActivity.goalID);
    if (!goal) return restOfTransaction;

    return {
      ...restOfTransaction,
      goalActivity: {
        goal: {
          id: goal.id,
          groupID: goal.groupID,
          name: goal.name,
          targetAmount: goal.targetAmount,
        },
        amount: goalActivity.amount,
      },
    };
  });
};

/**
 * Provides a memory-efficient stream of all transactions, formatted for export.
 *
 * This function is designed to handle massive datasets without causing memory
 * exhaustion. It operates as an asynchronous generator, fetching and processing
 * transactions in manageable chunks rather than loading the entire set at once.
 * Each chunk is enriched with relevant goal data before being yielded.
 *
 * Use this function with a `for await...of` loop to consume the data
 * stream chunk by chunk, for example, when writing to a file.
 *
 * @yields {ExportedTransactionListItem[]} An array of transactions formatted for export.
 */
async function* getTransactionChunksForExport(): AsyncGenerator<ExportedTransactionListItem[]> {
  let lastId = 0;

  while (true) {
    const transactionChunk = await db.transactionList
      .where('id')
      .above(lastId)
      .limit(TRANSACTION_FETCH_LIMIT)
      .toArray();

    if (transactionChunk.length === 0) break;
    lastId = transactionChunk[transactionChunk.length - 1].id!;

    const enrichedChunk = await enrichTransactionsWithGoalData(transactionChunk);
    yield enrichedChunk;
  }
}

export default getTransactionChunksForExport;
