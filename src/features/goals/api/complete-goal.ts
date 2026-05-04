import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';

type CompleteGoalParameters = {
  goalID?: string;
};

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

  await appDBUtil.goals.update(goal.id, { status: GoalStatus.Completed });
  await documentDBUtil.goal_list.update(goal.id, { status: GoalStatus.Completed });
};

export default completeGoal;
