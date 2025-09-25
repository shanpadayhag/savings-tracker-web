import { AppError } from '@/errors/app-error';
import type GoalListItem from '@/features/goals/entities/goal-list-item';
import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
import type TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';
import currency from 'currency.js';

type AllocateFundsToGoalParameters = {
  goalID: GoalListItem['id'];
  goalName: GoalListItem['name'];
  description: TransactionListItem['description'];
  amount: number;
  transactionDate?: Date;
};

type UpdateUserFundsParameters = {
  amount: number;
  date: Date;
};

/**
 * Updates the user's financial summary by deducting a specified amount from
 * the total available funds and setting the 'lastUpdated' timestamp.
 *
 * This is a private helper function designed to be called within a larger
 * database transaction to ensure data integrity.
 *
 * @private
 * @param {UpdateUserFundsParameters} params - The parameters for the update.
 * @param {number} params.amount - The amount to deduct from total available funds.
 * @param {Date} params.date - The timestamp to set for when the funds were last updated.
 * @returns {Promise<number>} A promise that resolves with the number of updated records (typically 1).
 * @throws {Error} If the singleton user record cannot be found.
 */
const updateUserFunds = async ({ amount, date }: UpdateUserFundsParameters) => {
  const user = await db.user.get('singleton');
  if (!user) throw new AppError("Let's Find You 🤔", "We can't find an account with those details. Please check them and try again.");

  const newTotalAvailableFunds = currency(user.financialSummary.totalAvailableFunds)
    .subtract(amount)
    .value;

  return db.user.update('singleton', {
    financialSummary: {
      ...user.financialSummary,
      totalAvailableFunds: newTotalAvailableFunds,
      lastUpdated: date,
    },
  });
};

/**
 * Allocates funds to a savings goal by logging the transaction, updating the
 * goal's balance, and adjusting the user's total available funds.
 * All operations are performed within a single atomic transaction.
 *
 * @param {AllocateFundsToGoalParameters} params - The details for the allocation.
 * @returns {Promise<void>} A promise that resolves when the allocation is complete.
 * @throws {Error} If the description is empty, the amount is not positive, or a database error occurs.
 */
const allocateFundsToGoal = async ({
  goalID,
  goalName,
  description,
  amount,
  transactionDate = new Date(),
}: AllocateFundsToGoalParameters): Promise<void> => {
  if (!description?.trim()) throw new AppError("Add a Note ✍️", "A quick description will help you remember this transaction later.");
  if (amount <= 0) throw new AppError("Boost Your Goal 📈", "Please enter an amount greater than zero to move closer to your target.");

  await db.transaction('rw', db.transactionList, db.goalList, db.user, async () => {
    await updateGoalAndLogTransaction({
      goal: { id: goalID!, name: goalName },
      description,
      amount,
      transactionDate,
    }, TransactionType.GoalAllocation);

    await updateUserFunds({ amount, date: transactionDate });
  });
};

export default allocateFundsToGoal;
