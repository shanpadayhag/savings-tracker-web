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

type TransactionListItem = {
  id?: Transaction['id'];
  type: Transaction['type'];
  notes: Transaction['notes'];
  entries: {
    type: TransactionEntry['sourceType'];
    id: TransactionEntry['sourceID'];
    name: string | null;
    currency: Currency | null;
    direction: TransactionEntry['direction'];
    amount: TransactionEntry['amount'];
  }[];
  createdAt: Transaction['createdAt'];
  updatedAt: Transaction['updatedAt'];
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
      transaction_list: "id, createdAt",
    });
  }
}

const documentDBUtil = new DB();
export default documentDBUtil;
