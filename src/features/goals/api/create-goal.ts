import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import Category from '@/features/categories/entities/category';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import isActiveRow from '@/utils/is-active-row';

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
    if (!category || !isActiveRow(category)) throw new AppError(
      "Category Not Found 🧐",
      "We couldn't find this category. It may have been deleted. Please choose another one.");
  }

  const goalID = crypto.randomUUID();
  const goalVersionID = crypto.randomUUID();
  // Default once at the top so every related row shares the same instant
  // (and the type system can rely on Date, not Date | undefined).
  const createdAt = params.createdAt ?? new Date();

  await appDBUtil.goals.add({
    id: goalID,
    status: params.status || GoalStatus.Active,
    statusChangedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
  });
  await appDBUtil.goal_versions.add({
    id: goalVersionID,
    goalID: goalID,
    name: params.name,
    targetAmount: targetAmount.value,
    currency: params.currency,
    categoryID: params.categoryID,
    createdAt,
    updatedAt: createdAt,
  });
  await documentDBUtil.goal_list.add({
    id: goalID,
    versionID: goalVersionID,
    name: params.name,
    targetAmount: targetAmount.value,
    savedAmount: 0,
    savedPercent: 0,
    // A fresh goal has nothing saved, so the entire target is remaining. The
    // reconciler computes this as `target - saved`; mirror that here so the
    // initial UI state matches a post-reconcile rebuild.
    remainingAmount: targetAmount.value,
    status: params.status || GoalStatus.Active,
    statusChangedAt: createdAt,
    currency: params.currency,
    categoryID: params.categoryID,
    createdAt,
    updatedAt: createdAt,
  });
};

export default createGoal;
