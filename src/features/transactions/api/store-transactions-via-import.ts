import adjustAccountBalance from '@/features/accounts/api/adjust-account-balance';
import createGoal from '@/features/goals/api/create-goal';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import spendFundsFromGoal from '@/features/transactions/api/spend-funds-from-goal';
import ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import { db } from '@/lib/utils';

type StoreTransactionsViaImportParams = {
  transactions: ExportedTransactionListItem[];
};

/**
 * Stores multiple transactions in the database using a single bulk operation.
 * @param {StoreTransactionsViaImportParams} params - The parameters for the import.
 * @param {ExportedTransactionListItem[]} params.transactions - The list of transactions to be stored.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const storeTransactionsViaImport = async ({
  transactions,
}: StoreTransactionsViaImportParams): Promise<void> => {
  for (const transaction of transactions) {
    if (transaction.goalActivity) {
      let goal = await db.goalList.get(transaction.goalActivity.goal.id!);

      if (!goal) {
        goal = await createGoal({
          id: transaction.goalActivity.goal.id,
          name: transaction.goalActivity.goal.name,
          targetAmount: transaction.goalActivity.goal.targetAmount,
        });
      }

      if (transaction.goalActivity.amount > 0) {
        await allocateFundsToGoal({
          goalID: goal.id,
          goalName: goal.name,
          description: transaction.description,
          amount: transaction.goalActivity.amount,
          transactionDate: transaction.createdAt,
        });
      } else {
        await spendFundsFromGoal({
          goalID: transaction.goalActivity.goal.id,
          goalName: transaction.goalActivity.goal.name,
          description: transaction.description,
          amount: transaction.goalActivity.amount,
          transactionDate: transaction.createdAt,
        });
      }
    } else if (transaction.accountAdjustment) {
      await adjustAccountBalance({
        amount: transaction.accountAdjustment.amount,
        transactionDate: transaction.createdAt,
      });
    }
  }
};

export default storeTransactionsViaImport;
