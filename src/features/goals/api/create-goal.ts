import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';
import currency from 'currency.js';

type CreateGoalParameters = {
  name: string,
  targetAmount: string,
  currency: Currency | undefined;
};

const createGoal = async (params: CreateGoalParameters): Promise<void> => {
  const targetAmount = currency(params.targetAmount);

  if (!params.name?.trim()) throw new AppError("Name Your Goal 🎯", "Every great goal needs a name. What will you call this one?");
  if (targetAmount.value <= 0) throw new AppError("Set a Target 📈", "What number are you aiming for? Please enter an amount greater than zero.");
  if (!params.currency) throw new AppError("Select a Currency 💰", "Please choose the currency for your target amount (e.g., USD, EUR).");

  const goalID = crypto.randomUUID();
  const goalVersionID = crypto.randomUUID();
  const now = new Date();

  await appDBUtil.goals.add({
    id: goalID,
    status: GoalStatus.Active,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null"
  });
  await appDBUtil.goal_versions.add({
    id: goalVersionID,
    goalID: goalID,
    name: params.name,
    targetAmount: targetAmount.value,
    currency: params.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null"
  });
  await documentDBUtil.goal_list.add({
    id: goalID,
    versionID: goalVersionID,
    name: params.name,
    targetAmount: targetAmount.value,
    savedAmount: 0,
    savedPercent: 0,
    remainingAmount: 0,
    status: GoalStatus.Active,
    currency: params.currency,
    createdAt: now,
    updatedAt: now
  });
};

export default createGoal;
