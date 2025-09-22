import GoalListItem from '@/features/goals/entities/goal-list-item';
import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';

type AllocateFundsToGoalParams = {
  goalID: GoalListItem['id'];
  goalName: GoalListItem['name'];
  description: TransactionListItem['description'];
  amount: number;
  transactionDate?: TransactionListItem['createdAt'];
};

/**
 * Deducts the allocated amount from the user's total available funds.
 * Updates the 'lastUpdated' timestamp for the user's financial summary.
 * @private
 * @param {object} params - The parameters for updating the user's funds.
 * @param {number} params.amount - The amount to deduct from total available funds.
 * @param {Date} params.date - The timestamp to set for when the funds were last updated.
 * @returns {Promise<number>} A promise that resolves with the number of updated database records.
 * @throws {Error} If the user's record cannot be found.
 */
const updateUserFunds = async (
  { amount, date }: { amount: number; date: Date; }
) => {
  const user = await db.user.get('singleton');
  if (!user) throw new Error('User not found.');

  return db.user.update('singleton', {
    financialSummary: {
      ...user.financialSummary,
      totalAvailableFunds: user.financialSummary.totalAvailableFunds - amount,
      lastUpdated: date,
    },
  });
};

/**
 * Orchestrates the allocation of funds to a savings goal. This function serves as the main entry point.
 * It validates input and executes the creation of a transaction log, the update of the goal's balance,
 * and the deduction from user funds within a single, atomic database transaction to ensure data integrity.
 *
 * @param {AllocateFundsToGoalParams} params - The parameters for the allocation.
 * @param {GoalListItem} params.goal - The target goal object, containing at least `id` and `name`.
 * @param {string} params.description - A description for the transaction record.
 * @param {number} params.amount - The positive amount of money to allocate.
 * @param {Date} [params.transactionDate=new Date()] - The specific date for the allocation. Defaults to the current date and time if not provided.
 * @returns {Promise<void>} A promise that resolves when the entire allocation process is complete.
 * @throws {Error} If the `goal.id` is missing or if any underlying database operation fails.
 */
const allocateFundsToGoal = async ({ goalID, goalName, description, amount, transactionDate = new Date() }: AllocateFundsToGoalParams) => {
  if (!description || amount <= 0) return;

  await db.transaction('rw', db.transactionList, db.goalList, db.user, async () => {
    await updateGoalAndLogTransaction({
      goal: {
        id: goalID!,
        name: goalName,
      },
      description: description,
      amount: amount,
      transactionDate: transactionDate,
    }, TransactionType.GoalAllocation);
    await updateUserFunds({ amount, date: transactionDate });
  });
};

export default allocateFundsToGoal;
