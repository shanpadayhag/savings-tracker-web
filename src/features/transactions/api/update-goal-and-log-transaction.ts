import Currency from '@/enums/currency';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';
import currencyUtil from '@/utils/currency-util';

type GoalTransactionParams = {
  goal: GoalListItem;
  description: TransactionListItem['description'];
  amount: number;
  currency: Currency;
  newSavedAmount: number;
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
 * @param {number} params.newSavedAmount - The positive, non-zero amount remaining to complete the transaction.
 * @param {Date} params.transactionDate - The timestamp for the transaction.
 * @param {TransactionType.GoalAllocation | TransactionType.GoalExpense} transactionType - Controls the operation. `GoalAllocation` adds to the balance, while `GoalExpense` subtracts from it.
 * @returns {Promise<void>} A promise that resolves when both database operations are complete.
 * @throws {Error} If the goal ID does not correspond to an existing goal.
 */
const updateGoalAndLogTransaction = async (
  { goal, description, amount, newSavedAmount, currency, transactionDate }: GoalTransactionParams,
  transactionType: TransactionType.GoalAllocation | TransactionType.GoalExpense,
) => {
  const isAllocation = transactionType === TransactionType.GoalAllocation;
  const actionText = isAllocation ? ['Allocated', 'to'] : ['Spent', 'from'];

  await db.transactionList.add({
    activity: `${actionText[0]} ${currencyUtil.format(amount, currency)} ${actionText[1]} ${goal.name}`,
    description: description,
    type: transactionType,
    createdAt: transactionDate,
    goalActivity: {
      goalID: goal.id!,
      amount: amount,
    },
  });

  await db.goalList.update(goal.id!, {
    currentAmount: newSavedAmount,
  });
};

export default updateGoalAndLogTransaction;
