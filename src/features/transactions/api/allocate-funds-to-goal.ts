import { AppError } from '@/errors/app-error';
import calculateAllocatedBalance from '@/features/calculations/api/calculate-allocated-balance';
import calculateRemainingBalance from '@/features/calculations/api/calculate-remaining-balance';
import type GoalListItem from '@/features/goals/entities/goal-list-item';
import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
import type TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import User from '@/features/user/entities/user';
import { db } from '@/lib/utils';

type AllocateFundsToGoalParameters = {
  goalID: GoalListItem['id'];
  description: TransactionListItem['description'];
  amount: number;
  transactionDate?: Date;
};

type UpdateUserFundsParameters = {
  user: User;
};

/**
 * This is a private helper function designed to update the user's financial
 * summary within a larger database transaction to ensure data integrity.
 * @private
 * @param {UpdateUserFundsParameters} params - The parameters for the update.
 * @param {User} params.user - The user with updated financial summary details.
 * @returns {Promise<number>} A promise that resolves with the number of updated records (typically 1).
 * @throws {Error} If the singleton user record cannot be found.
 */
const updateUserFunds = async ({ user }: UpdateUserFundsParameters) => {
  return db.user.update('singleton', {
    financialSummary: user.financialSummary,
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
  description,
  amount,
  transactionDate = new Date(),
}: AllocateFundsToGoalParameters): Promise<void> => {
  if (amount <= 0) throw new AppError("Boost Your Goal 📈", "Please enter an amount greater than zero to move closer to your target.");

  const user = await db.user.get('singleton');
  if (!user)throw new AppError("Let's Find You 🤔", "We can't find an account with those details. Please check them and try again.");

  const existingGoal = await db.goalList.get(goalID!);
  if (!existingGoal) throw new AppError("Goal Not Found 🔍", "We couldn't find this goal. It may have been deleted. Please try refreshing your list.");

  const newSavedAmount = calculateAllocatedBalance(existingGoal.currentAmount, amount).value;
  if (newSavedAmount > existingGoal.targetAmount) throw new AppError("Not Enough to Move 😬", "There aren't enough funds available to make this allocation. Please adjust the amount or add funds to your main account first.");

  const newAvailableFunds = calculateRemainingBalance(user.financialSummary.totalAvailableFunds, amount).value;
  if (newAvailableFunds < 0) throw new AppError("A Little Short 🤏", "It looks like your funds are a little short for this amount. Please adjust the amount or add funds to your account.");

  user.financialSummary.totalAvailableFunds = newAvailableFunds;
  user.financialSummary.lastUpdated = transactionDate;

  await db.transaction('rw', db.transactionList, db.goalList, db.user, async () => {
    await updateGoalAndLogTransaction({
      goal: existingGoal,
      description: description || null,
      amount,
      currency: user.financialSummary.currency,
      newSavedAmount,
      transactionDate,
    }, TransactionType.GoalAllocation);

    await updateUserFunds({ user });
  });
};

export default allocateFundsToGoal;
