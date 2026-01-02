import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus from '@/features/goals/enums/goal-status';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

const fetchGoals = async (): Promise<GoalListItem[]> => {
  const goalList = await documentDBUtil.goal_list
    .where('status').anyOf([GoalStatus.Active, GoalStatus.Completed])
    .reverse().sortBy("updatedAt");
  const now = new Date();

  return goalList.map(goalListItem => ({
    id: goalListItem.id,
    versionID: goalListItem.versionID,
    name: goalListItem.name,
    targetAmount: currencyUtil.parse(goalListItem.targetAmount, goalListItem.currency),
    savedAmount: currencyUtil.parse(goalListItem.savedAmount, goalListItem.currency),
    savedPercent: currencyUtil.parsePercent(goalListItem.savedPercent, goalListItem.currency),
    remainingAmount: currencyUtil.parse(goalListItem.remainingAmount, goalListItem.currency),
    status: goalListItem.status,
    currency: goalListItem.currency,
    createdAt: goalListItem.createdAt || now,
    updatedAt: goalListItem.createdAt || now,
  }));
};

export default fetchGoals;
