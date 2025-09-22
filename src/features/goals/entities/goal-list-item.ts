type GoalListItem = {
  id?: string;
  groupID?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: string; // active, archived, completed
  createdAt: Date;
  updatedAt: Date;
};

export default GoalListItem;
