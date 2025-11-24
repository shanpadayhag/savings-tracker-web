import GoalStatus from '@/features/goals/enums/goal-status';

type Goal = {
  id?: string;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default Goal;
