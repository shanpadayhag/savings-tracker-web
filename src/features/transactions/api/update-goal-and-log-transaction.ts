import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';

type GoalTransactionParams = {
  goal: { id: string; name: string; };
  description: string;
  amount: number;
  transactionDate?: Date;
};

/**
 * Handles the core logic for updating a goal's balance and creating a transaction record.
 * This is a private helper designed to be executed within a parent database transaction.
 * The operation (add or subtract) is determined by the `transactionType`.
 * @param {object} params - The transaction details.
 * @param {GoalReference} params.goal - The target goal.
 * @param {string} params.description - A user-provided description for the transaction.
 * @param {number} params.amount - The positive, non-zero amount to allocate or spend.
 * @param {Date} params.transactionDate - The timestamp for the transaction.
 * @param {TransactionType.GoalAllocation | TransactionType.GoalExpense} transactionType - Controls the operation. `GoalAllocation` adds to the balance, while `GoalExpense` subtracts from it.
 * @returns {Promise<void>} A promise that resolves when both database operations are complete.
 * @throws {Error} If the goal ID does not correspond to an existing goal.
 */
const updateGoalAndLogTransaction = async (
  { goal, description, amount, transactionDate }: GoalTransactionParams,
  transactionType: TransactionType.GoalAllocation | TransactionType.GoalExpense,
) => {
  const existingGoal = await db.goalList.get(goal.id);
  if (!existingGoal) throw new Error(`Goal with ID ${goal.id} not found.`);

  const isAllocation = transactionType === TransactionType.GoalAllocation;
  const multiplier = isAllocation ? 1 : -1;
  const actionText = isAllocation ? 'Allocated' : 'Spent';
  const signedAmount = amount * multiplier;
  const newCurrentAmount = existingGoal.currentAmount + signedAmount;

  await db.transactionList.add({
    activity: `${actionText} ${Math.abs(amount)} for ${goal.name}`,
    description: description,
    type: transactionType,
    createdAt: transactionDate,
    goalActivity: {
      goalID: goal.id,
      amount: amount,
    },
  });

  await db.goalList.update(goal.id, {
    currentAmount: newCurrentAmount,
  });
};

export default updateGoalAndLogTransaction;
