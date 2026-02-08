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
      goal_versions: "id, [goalID+createdAt], name",
      transactions: "id",
      transaction_entries: "id, transactionID",
    });
  }
}

const appDBUtil = new DB();

appDBUtil.tables.forEach(table => {
  table.hook('creating', function (_primKey, obj, _transaction) {
    const now = new Date();
    if (!obj.createdAt) obj.createdAt = now;
    if (!obj.updatedAt) obj.updatedAt = now;
    if (!obj.deletedAt) obj.deletedAt = "null";
  });

  table.hook('updating', function (_modifications, _primKey, _obj, _transaction) {
    return { updatedAt: new Date() };
  });
});

export default appDBUtil;
