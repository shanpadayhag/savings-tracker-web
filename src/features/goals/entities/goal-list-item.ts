import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import GoalVersion from '@/features/goals/entities/goal-version';
import currency from 'currency.js';

type GoalListItem = {
  id: Goal['id'];
  versionID: GoalVersion['id'];
  name: GoalVersion['name'];
  targetAmount: currency;
  savedAmount: currency;
  savedPercent: currency;
  remainingAmount: currency;
  status: Goal['status'];
  statusChangedAt?: Goal['statusChangedAt'];
  currency: GoalVersion['currency'];
  categoryID?: Category['id'];
  createdAt: Goal['createdAt'];
  updatedAt: GoalVersion['createdAt'];
};

export default GoalListItem;
