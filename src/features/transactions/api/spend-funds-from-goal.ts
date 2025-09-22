import GoalListItem from '@/features/goals/entities/goal-list-item';
import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';

type SpendFundsFromGoalParams = {
  goalID: GoalListItem['id'];
  goalName: GoalListItem['name'];
  description: string;
  amount: number;
  transactionDate?: Date;
};

/**
 * Records an expense by deducting funds from a specific goal's balance.
 * This function ensures data integrity by wrapping the balance update and
 * transaction log creation in a single, atomic database transaction.
 *
 * @param {SpendFundsFromGoalParams} params - The parameters for the expense.
 * @param {GoalReference} params.goal - The goal from which funds are being spent.
 * @param {string} params.description - A description for the transaction record.
 * @param {number} params.amount - The positive amount of money to spend.
 * @param {Date} [params.transactionDate=new Date()] - The date of the expense. Defaults to now.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws {Error} If the goal ID is missing or if the database operation fails.
 */
const spendFundsFromGoal = async ({ goalID, goalName, description, amount, transactionDate = new Date() }: SpendFundsFromGoalParams) => {
  if (!description || amount <= 0) return;

  await db.transaction('rw', db.transactionList, db.goalList, async () => {
    await updateGoalAndLogTransaction({
      goal: { id: goalID!, name: goalName },
      description: description,
      amount: amount,
      transactionDate: transactionDate,
    }, TransactionType.GoalExpense);
  });
};

export default spendFundsFromGoal;
