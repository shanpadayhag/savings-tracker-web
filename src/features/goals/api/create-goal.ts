import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import Category from '@/features/categories/entities/category';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type CreateGoalParameters = {
  name: string;
  targetAmount: string;
  currency: Currency | undefined;
  categoryID?: Category['id'];
  status?: GoalStatus;
  createdAt?: Date;
};

const createGoal = async (params: CreateGoalParameters): Promise<void> => {
  if (!params.currency) throw new AppError("Select a Currency 💰", "Please choose the currency for your target amount (e.g., USD, EUR).");
  const targetAmount = currencyUtil.parse(params.targetAmount, params.currency);

  if (!params.name?.trim()) throw new AppError("Name Your Goal 🎯", "Every great goal needs a name. What will you call this one?");
  if (targetAmount.value <= 0) throw new AppError("Set a Target 📈", "What number are you aiming for? Please enter an amount greater than zero.");

  if (params.categoryID) {
    const category = await appDBUtil.categories.get(params.categoryID);
    if (!category || category.deletedAt !== 'null') throw new AppError(
      "Category Not Found 🧐",
      "We couldn't find this category. It may have been deleted. Please choose another one.");
  }

  const goalID = crypto.randomUUID();
  const goalVersionID = crypto.randomUUID();

  await appDBUtil.goals.add({
    id: goalID,
    status: params.status || GoalStatus.Active,
    statusChangedAt: params.createdAt,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  });
  await appDBUtil.goal_versions.add({
    id: goalVersionID,
    goalID: goalID,
    name: params.name,
    targetAmount: targetAmount.value,
    currency: params.currency,
    categoryID: params.categoryID,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  });
  await documentDBUtil.goal_list.add({
    id: goalID,
    versionID: goalVersionID,
    name: params.name,
    targetAmount: targetAmount.value,
    savedAmount: 0,
    savedPercent: 0,
    remainingAmount: 0,
    status: params.status || GoalStatus.Active,
    statusChangedAt: params.createdAt,
    currency: params.currency,
    categoryID: params.categoryID,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  });
};

export default createGoal;
