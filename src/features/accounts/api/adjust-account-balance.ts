import { AppError } from '@/errors/app-error';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';
import currency from 'currency.js';

type AdjustAccountBalanceParams = {
  amount: number;
  transactionDate?: Date;
};

/**
 * Adjusts the user's total available funds and records an atomic transaction.
 * This function is used for general income or expenses not tied to a specific savings goal.
 * It handles both positive (income) and negative (expense/correction) amounts.
 *
 * @param {AdjustAccountBalanceParams} params - The parameters for the account adjustment.
 * @param {number} params.amount - The amount to adjust the balance by. A positive value increases funds (e.g., salary), while a negative value decreases them (e.g., a bill payment).
 * @param {Date} [params.transactionDate=new Date()] - The date of the transaction. Defaults to now.
 * @returns {Promise<void>} A promise that resolves when the adjustment and transaction logging are complete.
 * @throws {Error} If the user record cannot be found in the database.
 */
const adjustAccountBalance = async ({ amount, transactionDate = new Date() }: AdjustAccountBalanceParams) => {
  if (amount === 0) return;

  await db.transaction('rw', db.user, db.transactionList, async () => {
    const user = await db.user.get('singleton');
    if (!user) throw new AppError("Let's Find You 🤔", "We can't find an account with those details. Please check them and try again.");

    await db.user.update('singleton', {
      financialSummary: {
        ...user.financialSummary,
        totalAvailableFunds: currency(user.financialSummary.totalAvailableFunds)
          .add(amount).value,
        lastUpdated: transactionDate,
      },
    });

    const actionText = amount > 0 ? 'Added' : 'Deducted';
    const absAmount = Math.abs(amount);

    await db.transactionList.add({
      activity: `${actionText} ${absAmount} to account balance`,
      description: "Allocation for account balance",
      type: TransactionType.AccountAdjustment,
      createdAt: transactionDate,
      accountAdjustment: { amount },
    });
  });
};

export default adjustAccountBalance;
