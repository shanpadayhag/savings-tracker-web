// import Currency from '@/enums/currency';
// import { AppError } from '@/errors/app-error';
// import calculateRemainingBalance from '@/features/calculations/api/calculate-remaining-balance';
// import type GoalListItem from '@/features/goals/entities/goal-list-item';
// import updateGoalAndLogTransaction from '@/features/transactions/api/update-goal-and-log-transaction';
// import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
// import TransactionType from '@/features/transactions/enums/transaction-type';
// import { db } from '@/lib/utils';

// type SpendFundsFromGoalParameters = {
//   goalID: GoalListItem['id'];
//   description: TransactionListItem['description'];
//   amount: number;
//   currency: Currency;
//   transactionDate?: Date;
// };

// /**
//  * Records an expense by deducting funds from a specific goal's balance.
//  *
//  * This function creates a transaction log for the expense and updates the goal's
//  * current balance within a single, atomic database transaction to ensure data integrity.
//  *
//  * @param {SpendFundsFromGoalParameters} params - The parameters for the expense transaction.
//  * @returns {Promise<void>} A promise that resolves when the operation is complete.
//  * @throws {Error} If the description is empty, the amount is not positive, or a database error occurs.
//  */
// const spendFundsFromGoal = async ({
//   goalID,
//   description,
//   amount,
//   currency,
//   transactionDate = new Date(),
// }: SpendFundsFromGoalParameters): Promise<void> => {
//   if (!description?.trim()) throw new AppError("Add a Note ✍️", "A quick description will help you remember this transaction later.");
//   if (amount <= 0) throw new AppError("Log Your Spending 💸", "Please enter an amount greater than zero to track this expense.");

//   const existingGoal = await db.goalList.get(goalID!);
//   if (!existingGoal) throw new AppError("Goal Not Found 🔍", "We couldn't find this goal. It may have been deleted. Please try refreshing your list.");

//   const newSavedAmount = calculateRemainingBalance(existingGoal.currentAmount, amount).value;
//   if (newSavedAmount < 0) throw new AppError("Goal is a Little Short 🤏", "This goal doesn't have enough funds to cover this expense. Please adjust the amount or allocate more funds to this goal first.");

//   await db.transaction('rw', db.transactionList, db.goalList, async () => {
//     await updateGoalAndLogTransaction({
//       goal: existingGoal,
//       description,
//       amount,
//       currency,
//       newSavedAmount,
//       transactionDate,
//     }, TransactionType.GoalExpense);
//   });
// };

// export default spendFundsFromGoal;
