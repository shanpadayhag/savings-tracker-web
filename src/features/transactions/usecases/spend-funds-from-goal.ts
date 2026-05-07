import { AppError } from '@/errors/app-error';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import isActiveRow from '@/utils/is-active-row';

type SpendFundsFromGoalParams = {
  goalID?: Goal['id'];
  notes: Transaction['notes'];
  amount: string;
  /** Optional category ID. Falls back to the system "Others" category so a
   * user who skips the picker still produces a categorized row. */
  categoryID?: Category['id'];
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

  // Resolve the category. If the caller passed an ID we look it up; otherwise
  // (or if the lookup misses) fall back to the seeded "Others" row so every
  // spend transaction is always categorized at write time.
  const fallbackCategory = await ensureDefaultCategory();
  const pickedCategory = params.categoryID
    ? await appDBUtil.categories.get(params.categoryID)
    : null;
  const category = pickedCategory && isActiveRow(pickedCategory)
    ? pickedCategory
    : fallbackCategory;

  // Default once at the top so every related row shares the same instant.
  const transactionTimestamp = params.createdAt ?? new Date();
  const transaction = {
    id: crypto.randomUUID(),
    type: TransactionType.Spend,
    notes: params.notes?.trim() || null,
    categoryID: category.id,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.Goal,
    sourceID: existingGoal.id,
    direction: TransactionDirection.From,
    amount: paramsAmount.value,
    currency: existingGoal.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.To,
    amount: paramsAmount.value,
    currency: existingGoal.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
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
    categoryID: category.id,
    categoryName: category.name,
    categoryColor: category.color,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
    reversedCreatedAt: transactionTimestamp.getTime() * -1,
  });

  // Guard divide-by-zero: imported / legacy goals can have a 0 target. Mirror
  // the reconciler's behavior (0% rather than NaN/Infinity).
  const targetValue = existingGoal.targetAmount;
  const savedPercent = targetValue === 0
    ? 0
    : newSavedAmount.multiply(100).divide(targetValue).value;
  await documentDBUtil.goal_list.update(existingGoal.id!, {
    savedAmount: newSavedAmount.value,
    savedPercent,
    remainingAmount: newSavedAmount.subtract(targetValue).multiply(-1).value,
  });
};

export default spendFundsFromGoal;
