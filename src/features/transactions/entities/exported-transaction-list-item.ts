import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';

type ExportedTransactionListItem = {
  type: TransactionListItem['type'];
  activity: TransactionListItem['activity'];
  description: TransactionListItem['description'];
  createdAt?: TransactionListItem['createdAt'];
  accountAdjustment?: TransactionListItem['accountAdjustment'];
  goalActivity?: {
    goal: {
      id: GoalListItem['id'],
      groupID: GoalListItem['groupID'],
      name: GoalListItem['name'],
      targetAmount: GoalListItem['targetAmount'],
    };
    amount: number;
  };
};

export default ExportedTransactionListItem;
