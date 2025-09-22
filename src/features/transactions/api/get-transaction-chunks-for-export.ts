import ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import { db } from '@/lib/utils';

const TRANSACTION_FETCH_LIMIT = 250000;

/**
 * An async generator that yields chunks of transactions from the database.
 * This is memory-efficient for exporting large datasets.
 */
async function* getTransactionChunksForExport(): AsyncGenerator<ExportedTransactionListItem[]> {
  let lastId = 0;
  let transactionsChunk: TransactionListItem[];

  do {
    transactionsChunk = await db.transactionList
      .where('id').above(lastId)
      .limit(TRANSACTION_FETCH_LIMIT)
      .toArray();

    if (transactionsChunk.length > 0) {
      lastId = transactionsChunk[transactionsChunk.length - 1].id!;

      console.log(transactionsChunk);
      const goalGroupIds = [...new Set(transactionsChunk.map(t => t.goalActivity?.goalID || 0).filter(Boolean))];

      console.log(goalGroupIds);
      const allGoalVersions = await db.goalList
        .where('id').anyOf(goalGroupIds)
        .toArray();

      console.log(allGoalVersions);
      const latestGoalsMap = new Map();
      for (const goal of allGoalVersions) {
        const existing = latestGoalsMap.get(goal.id);
        if (!existing || goal.createdAt > existing.createdAt) {
          latestGoalsMap.set(goal.id, goal);
        }
      }

      const transactionsWithGoals = transactionsChunk.map(transaction => {
        if (!transaction.goalActivity) return transaction;

        const specificGoal = latestGoalsMap.get(transaction.goalActivity.goalID);

        return {
          ...transaction,
          goalActivity: {
            goal: {
              id: specificGoal.id,
              groupID: specificGoal.groupID,
              name: specificGoal.name,
              targetAmount: specificGoal.targetAmount,
            },
            amount: transaction.goalActivity?.amount,
          }
        };
      });

      yield transactionsWithGoals as any;
    }
  } while (transactionsChunk.length > 0);
}

export default getTransactionChunksForExport;
