import Goal from '@/features/goals/entities/goal';
import appDBUtil from '@/utils/app-db-util';

const getGoals = async (): Promise<Goal[]> => {
  return appDBUtil.goals.toArray();
};

export default getGoals;
