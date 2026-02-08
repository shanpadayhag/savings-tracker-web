import GoalVersion from '@/features/goals/entities/goal-version';
import appDBUtil from '@/utils/app-db-util';

const getGoalVersions = async (): Promise<GoalVersion[]> => {
  return appDBUtil.goal_versions.toArray();
};

export default getGoalVersions;
