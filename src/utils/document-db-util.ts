import RawGoalListItem from '@/features/goals/entities/goal-list-item';
import Dexie from 'dexie';

type GoalListItem = Omit<RawGoalListItem, 'targetAmount' | 'savedAmount' | 'savedPercent' | 'remainingAmount'> & {
  targetAmount: number;
  savedAmount: number;
  savedPercent: number;
  remainingAmount: number;
};

class DB extends Dexie {
  goal_list!: Dexie.Table<GoalListItem, GoalListItem['id']>;

  constructor() {
    super("savings_tracker_document");
    this.version(1).stores({
      wallet_list: "id",
      goal_list: "id, status",
    });
  }
}

const documentDBUtil = new DB();
export default documentDBUtil;
