import Goal from '@/features/goals/entities/goal';
import GoalVersion from '@/features/goals/entities/goal-version';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import User from '@/features/user/entities/user-old';
import Wallet from '@/features/wallets/entities/wallet';
import Dexie from 'dexie';

class DB extends Dexie {
  users!: Dexie.Table<User, "singleton">;
  wallets!: Dexie.Table<Wallet, Wallet['id']>;
  goals!: Dexie.Table<Goal, Goal['id']>;
  goal_versions!: Dexie.Table<GoalVersion, GoalVersion['id']>;
  transactions!: Dexie.Table<Transaction, Transaction['id']>;
  transaction_entries!: Dexie.Table<TransactionEntry, TransactionEntry['id']>;

  constructor() {
    super("savings_tracker_app");
    this.version(1).stores({
      users: "id",
      wallets: "id",
      goals: "id",
      goal_versions: "id, [goalID+createdAt]",
      transactions: "id",
      transaction_entries: "id",
    });
  }
}

const appDBUtil = new DB();
export default appDBUtil;
