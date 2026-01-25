import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import Goal from '@/features/goals/entities/goal';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type SpendFundsFromGoalParams = {
  goalID?: Goal['id'];
  notes: Transaction['notes'];
  amount: string;
  createdAt?: Date;
};

const spendFundsFromGoal = async (params: SpendFundsFromGoalParams) => {
  const existingGoal = await documentDBUtil.goal_list.get(params.goalID || "");
  if (!existingGoal) throw new AppError("Goal Not Found 🔍", "We couldn't find this goal. It may have been deleted. Please try refreshing your list.");

  const paramsAmount = currencyUtil.parse(params.amount, existingGoal.currency);
  if (paramsAmount.value <= 0) throw new AppError("Log Your Spending 💸", "Please enter an amount greater than zero to track this expense.");

  const goalSavedAmount = currencyUtil.parse(existingGoal.savedAmount, existingGoal.currency);
  const newSavedAmount = goalSavedAmount.subtract(params.amount);
  if (newSavedAmount.value < 0) throw new AppError("Goal is a Little Short 🤏", "This goal doesn't have enough funds to cover this expense. Please adjust the amount or allocate more funds to this goal first.");

  const transaction = {
    id: crypto.randomUUID(),
    type: TransactionType.Spend,
    notes: params.notes?.trim() || null,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.Goal,
    sourceID: existingGoal.id,
    direction: TransactionDirection.From,
    amount: paramsAmount.value,
    currency: existingGoal.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.To,
    amount: paramsAmount.value,
    currency: existingGoal.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };

  await appDBUtil.transactions.add(transaction);
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);

  await documentDBUtil.transaction_list.add({
    id: transaction.id,
    type: transaction.type,
    notes: transaction.notes,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: existingGoal.name,
      currency: existingGoal.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: null,
      currency: existingGoal.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    reversedCreatedAt: params?.createdAt
      ? params.createdAt.getTime() * -1
      : undefined
  });

  await documentDBUtil.goal_list.update(existingGoal.id!, {
    savedAmount: newSavedAmount.value,
    savedPercent: newSavedAmount.divide(existingGoal.targetAmount).multiply(100).value,
    remainingAmount: newSavedAmount.subtract(existingGoal.targetAmount).multiply(-1).value,
  });
};

export default spendFundsFromGoal;
