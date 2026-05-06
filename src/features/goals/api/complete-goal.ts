import { AppError } from '@/errors/app-error';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import Category from '@/features/categories/entities/category';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type CompleteGoalParameters = {
  goalID?: string;
  createdAt?: Date;
};

const COMPLETE_GOAL_NOTE = 'Goal completed';

const completeGoal = async (params: CompleteGoalParameters): Promise<void> => {
  const goal = await documentDBUtil.goal_list.get(params.goalID || "");
  if (!goal) throw new AppError(
    "Goal Not Found 🔍",
    "We couldn't find this goal. It may have been deleted. Please try refreshing your list.");
  if (goal.status === GoalStatus.Completed) throw new AppError(
    "Already Completed 🏆",
    "This goal is already marked as completed.");
  if (goal.status === GoalStatus.Archived) throw new AppError(
    "Goal Archived 📦",
    "Archived goals can't be completed. Restore the goal first.");

  const savedAmount = currencyUtil.parse(goal.savedAmount, goal.currency);

  if (savedAmount.value > 0) {
    let category: Category | undefined = goal.categoryID
      ? await appDBUtil.categories.get(goal.categoryID)
      : undefined;
    if (!category || category.deletedAt !== 'null') category = await ensureDefaultCategory();
    const transactionID = crypto.randomUUID();
    const fromEntry = {
      id: crypto.randomUUID(),
      transactionID: transactionID,
      sourceType: TransactionSourceType.Goal,
      sourceID: goal.id,
      direction: TransactionDirection.From,
      amount: savedAmount.value,
      currency: goal.currency,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    };
    const toEntry = {
      id: crypto.randomUUID(),
      transactionID: transactionID,
      sourceType: TransactionSourceType.External,
      sourceID: null,
      direction: TransactionDirection.To,
      amount: savedAmount.value,
      currency: goal.currency,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    };

    await appDBUtil.transactions.add({
      id: transactionID,
      type: TransactionType.Spend,
      notes: COMPLETE_GOAL_NOTE,
      categoryID: category.id,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    });
    await appDBUtil.transaction_entries.add(fromEntry);
    await appDBUtil.transaction_entries.add(toEntry);
    await documentDBUtil.transaction_list.add({
      id: transactionID,
      type: TransactionType.Spend,
      notes: COMPLETE_GOAL_NOTE,
      entries: [{
        type: fromEntry.sourceType,
        sourceID: fromEntry.sourceID,
        name: goal.name,
        currency: goal.currency,
        direction: fromEntry.direction,
        amount: fromEntry.amount,
      }, {
        type: toEntry.sourceType,
        sourceID: toEntry.sourceID,
        name: null,
        currency: goal.currency,
        direction: toEntry.direction,
        amount: toEntry.amount,
      }],
      categoryID: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
      reversedCreatedAt: params?.createdAt
        ? params.createdAt.getTime() * -1
        : undefined,
    });

    const targetAmount = currencyUtil.parse(goal.targetAmount, goal.currency);
    await documentDBUtil.goal_list.update(goal.id, {
      savedAmount: 0,
      savedPercent: 0,
      remainingAmount: targetAmount.value,
    });
  }

  await appDBUtil.goals.update(goal.id, { status: GoalStatus.Completed });
  await documentDBUtil.goal_list.update(goal.id, { status: GoalStatus.Completed });
};

export default completeGoal;
