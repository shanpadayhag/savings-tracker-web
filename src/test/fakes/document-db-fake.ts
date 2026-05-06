import Currency from '@/enums/currency';
import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import Wallet from '@/features/wallets/entities/wallet';
import InMemoryTable from '@/test/fakes/in-memory-table';

type WalletListItemRecord = {
  id: Wallet['id'];
  name: Wallet['name'];
  currency: Wallet['currency'];
  currentAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type GoalListItemRecord = {
  id: Goal['id'];
  versionID: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  savedPercent: number;
  remainingAmount: number;
  status: Goal['status'];
  currency: Currency;
  categoryID?: Category['id'];
  createdAt?: Date;
  updatedAt?: Date;
};

type TransactionListItemRecord = {
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
  categoryID?: Category['id'];
  categoryName?: Category['name'];
  categoryColor?: Category['color'];
  createdAt?: Transaction['createdAt'];
  updatedAt?: Transaction['updatedAt'];
  reversedCreatedAt?: number;
};

class DocumentDBFake {
  wallet_list = new InMemoryTable<WalletListItemRecord>();
  goal_list = new InMemoryTable<GoalListItemRecord>();
  transaction_list = new InMemoryTable<TransactionListItemRecord>();

  reset(): void {
    this.wallet_list.reset();
    this.goal_list.reset();
    this.transaction_list.reset();
  }
}

const documentDBFake = new DocumentDBFake();
export default documentDBFake;
