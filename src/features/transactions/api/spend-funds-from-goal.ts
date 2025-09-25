import { AppError } from '@/errors/app-error';
import type GoalListItem from '@/features/goals/entities/goal-list-item';
import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';

type SpendFundsFromGoalParameters = {
  goalID: GoalListItem['id'];
  goalName: GoalListItem['name'];
  description: string;
  amount: number;
  transactionDate?: Date;
};

/**
 * Records an expense by deducting funds from a specific goal's balance.
 *
 * This function creates a transaction log for the expense and updates the goal's
 * current balance within a single, atomic database transaction to ensure data integrity.
 *
 * @param {SpendFundsFromGoalParameters} params - The parameters for the expense transaction.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws {Error} If the description is empty, the amount is not positive, or a database error occurs.
 */
const spendFundsFromGoal = async ({
  goalID,
  goalName,
  description,
  amount,
  transactionDate = new Date(),
}: SpendFundsFromGoalParameters): Promise<void> => {
  if (!description?.trim()) throw new AppError("Add a Note ✍️", "A quick description will help you remember this transaction later.");
  if (amount <= 0) throw new AppError("Log Your Spending 💸", "Please enter an amount greater than zero to track this expense.");

  await db.transaction('rw', db.transactionList, db.goalList, async () => {
    await updateGoalAndLogTransaction({
      goal: { id: goalID!, name: goalName },
      description,
      amount,
      transactionDate,
    }, TransactionType.GoalExpense);
  });
};

export default spendFundsFromGoal;
