type TransactionListItem = {
  id?: number;
  date?: Date;
  type: string; // goal_allocation, account_balance_adjustment
  activity: string;
  description: string;
  accountBalanceAdjustment?: {
    amount: number;
  };
  goalAllocation?: {
    goal: {
      id: number;
      name: string;
    };
    amountAllocated: number;
  };
};

export default TransactionListItem;
