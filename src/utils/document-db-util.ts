import Currency from '@/enums/currency';
import RawGoalListItem from '@/features/goals/entities/goal-list-item';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import RawWalletListItem from '@/features/wallets/entities/wallet-list-item';
import Dexie from 'dexie';

type GoalListItem = Omit<RawGoalListItem, 'targetAmount' | 'savedAmount' | 'savedPercent' | 'remainingAmount'> & {
  targetAmount: number;
  savedAmount: number;
  savedPercent: number;
  remainingAmount: number;
};

type WalletListItem = Omit<RawWalletListItem, 'currentAmount'> & {
  currentAmount: number;
};

// Add new properties, which should follow
// the transaction list item object. So that there's no need
// for unnecessary formatting.
type TransactionListItem = {
  id?: Transaction['id'];
  type: Transaction['type'];
  notes: Transaction['notes'];
  entries: {
    type: TransactionEntry['sourceType'];
    sourceID: TransactionEntry['sourceID'];
    name: string | null;
    currency: Currency;
    direction: TransactionEntry['direction'];
    amount: TransactionEntry['amount'];
  }[];
  createdAt?: Transaction['createdAt'];
  updatedAt?: Transaction['updatedAt'];
  reversedCreatedAt?: number;
};

class DB extends Dexie {
  wallet_list!: Dexie.Table<WalletListItem, WalletListItem['id']>;
  goal_list!: Dexie.Table<GoalListItem, GoalListItem['id']>;
  transaction_list!: Dexie.Table<TransactionListItem, TransactionListItem['id']>;

  constructor() {
    super("savings_tracker_document");
    this.version(1).stores({
      wallet_list: "id",
      goal_list: "id, status",
      transaction_list: "id, [reversedCreatedAt+id]",
    });
  }
}

const documentDBUtil = new DB();

documentDBUtil.tables.forEach(table => {
  table.hook('creating', function (_primKey, obj, _transaction) {
    const now = new Date();
    if (!obj.createdAt) obj.createdAt = now;
    if (!obj.updatedAt) obj.updatedAt = now;
    if (table.name === "transaction_list" && !obj.reversedCreatedAt) obj.reversedCreatedAt = now.getTime() * -1;
  });

  table.hook('updating', function (_modifications, _primKey, _obj, _transaction) {
    return { updatedAt: new Date() };
  });
});

export default documentDBUtil;
