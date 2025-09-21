type GoalListItem = {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  currency: string; // usd, euro, php
  status: string; // active, archived, completed
  createdAt: Date;
  updatedAt: Date;
};

export default GoalListItem;
