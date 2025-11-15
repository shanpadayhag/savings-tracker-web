import GoalStatus from '@/features/goals/enums/goal-status';

type GoalListItem = {
  id?: string;
  groupID?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
};

export default GoalListItem;
