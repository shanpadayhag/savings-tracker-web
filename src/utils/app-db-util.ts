import Activity from '@/features/activities/entities/activity';
import User from '@/features/user/entities/user-old';
import Wallet from '@/features/wallets/entities/wallet';
import Dexie from 'dexie';

class DB extends Dexie {
  users!: Dexie.Table<User, "singleton">;
  wallets!: Dexie.Table<Wallet, Wallet['id']>;
  activities!: Dexie.Table<Activity, Activity['id']>;

  constructor() {
    super("savings_tracker_app");
    this.version(1).stores({
      users: "id",
      wallets: "id, deletedAt",
      goals: "id",
      goal_versions: "id",
      transactions: "id",
      activities: "id",
    });
  }
}

const appDBUtil = new DB();
export default appDBUtil;
