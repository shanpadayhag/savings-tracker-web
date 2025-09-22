import adjustAccountBalance from '@/features/accounts/api/adjust-account-balance';
import createGoal from '@/features/goals/api/create-goal';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import spendFundsFromGoal from '@/features/transactions/api/spend-funds-from-goal';
import type ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import { db } from '@/lib/utils';

type ProcessImportedTransactionsParams = {
  transactions: ExportedTransactionListItem[];
};

type GoalInfo = { id: string; name: string; targetAmount: number; };

/**
 * Scans a list of transactions and compiles a de-duplicated map of all associated goals.
 *
 * This is a performance optimization step. By gathering each unique goal's metadata
 * once, it prevents redundant database queries in subsequent processing stages.
 *
 * @private
 * @param {ExportedTransactionListItem[]} transactions - The list of imported transactions to analyze.
 * @returns {Map<string, GoalInfo>} A Map where each key is a unique goal ID and the value
 *   is an object containing the goal's essential details.
 */
const extractUniqueGoalInfo = (
  transactions: ExportedTransactionListItem[],
): Map<string, GoalInfo> => {
  const goalInfoMap = new Map<string, GoalInfo>();
  for (const transaction of transactions) {
    const goal = transaction.goalActivity?.goal;
    if (goal?.id && !goalInfoMap.has(goal.id)) {
      goalInfoMap.set(goal.id, {
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
      });
    }
  }
  return goalInfoMap;
};


/**
 * Ensures all goals required by a set of transactions exist in the database.
 *
 * This function takes a map of goal metadata, concurrently checks for their existence,
 * and creates any that are missing in a single batch operation. It serves as a
 * crucial preparatory step to guarantee that all goal-related transactions can be
 * successfully processed.
 *
 * @private
 * @param {Map<string, GoalInfo>} goalInfoMap - A map of unique goals required for the transactions, keyed by goal ID.
 * @returns {Promise<Map<string, GoalListItem>>} A promise that resolves to a comprehensive lookup map. This map contains
 *   the full `Goal` objects for both pre-existing and newly created goals, ready for use in subsequent operations.
 */
const ensureGoalsExist = async (
  goalInfoMap: Map<string, GoalInfo>,
): Promise<Map<string, GoalListItem>> => {
  const goalIds = Array.from(goalInfoMap.keys());
  const existingGoals = await Promise.all(goalIds.map(id => db.goalList.get(id)));
  const goalsLookup = new Map<string, GoalListItem>();
  const newGoalPromises: Promise<GoalListItem>[] = [];

  existingGoals.forEach((goal, index) => {
    if (goal) {
      goalsLookup.set(goal.id!, goal);
    } else {
      const goalInfo = goalInfoMap.get(goalIds[index])!;
      newGoalPromises.push(createGoal(goalInfo));
    }
  });

  const newGoals = await Promise.all(newGoalPromises);
  newGoals.forEach(goal => goalsLookup.set(goal.id!, goal));

  return goalsLookup;
};

/**
 * Creates and executes all database operations derived from a list of transactions.
 *
 * This is the final execution stage of the import process. It maps each transaction
 * record to a specific, asynchronous action (e.g., `allocateFundsToGoal`, `spendFundsFromGoal`,
 * `adjustAccountBalance`). All generated actions are then run concurrently to
 * maximize throughput.
 *
 * @private
 * @param {ExportedTransactionListItem[]} transactions - The list of transaction records to be executed.
 * @param {Map<string, Goal>} goalsLookup - A pre-populated map providing quick access to the full `Goal` objects
 *   needed for goal-related operations.
 * @returns {Promise<void>} A promise that resolves when all concurrent operations have successfully completed.
 * @throws {Error} Propagates any error that occurs if one of the underlying database operations fails.
 */
const executeTransactionOperations = async (
  transactions: ExportedTransactionListItem[],
  goalsLookup: Map<string, GoalListItem>,
): Promise<void> => {
  const operations = transactions.map(transaction => {
    if (transaction.goalActivity) {
      const { goal, amount } = transaction.goalActivity;
      const currentGoal = goalsLookup.get(goal.id!)!;
      const operation = amount > 0 ? allocateFundsToGoal : spendFundsFromGoal;

      return operation({
        goalID: currentGoal.id,
        goalName: currentGoal.name,
        description: transaction.description,
        amount,
        transactionDate: transaction.createdAt,
      });
    }

    if (transaction.accountAdjustment) {
      return adjustAccountBalance({
        amount: transaction.accountAdjustment.amount,
        transactionDate: transaction.createdAt,
      });
    }
    return null;
  });

  await Promise.all(operations.filter(Boolean));
};

/**
 * Orchestrates the end-to-end process of importing and persisting a list of transactions.
 *
 * This function serves as the primary entry point for the bulk import feature. It is
 * highly optimized to handle large datasets by breaking the process into three distinct,
 * concurrent stages:
 *
 * 1.  **Data Extraction:** Scans the transaction list to identify all unique goals.
 * 2.  **Goal Provisioning:** Fetches existing goals and creates missing ones in batch.
 * 3.  **Operation Execution:** Executes all individual transaction operations concurrently.
 *
 * This approach minimizes database round-trips and maximizes performance.
 *
 * @param {ProcessImportedTransactionsParams} params - The parameters for the import process.
 * @param {ExportedTransactionListItem[]} params.transactions - The list of transaction records to process.
 * @returns {Promise<void>} A promise that resolves once all operations are complete.
 * @throws {Error} Throws if any underlying database operation fails during the process.
 */
const processImportedTransactions = async ({
  transactions,
}: ProcessImportedTransactionsParams): Promise<void> => {
  const goalInfoMap = extractUniqueGoalInfo(transactions);
  const goalsLookup = await ensureGoalsExist(goalInfoMap);

  await executeTransactionOperations(transactions, goalsLookup);
};

export default processImportedTransactions;
