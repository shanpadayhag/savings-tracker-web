import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import GoalVersion from '@/features/goals/entities/goal-version';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import User from '@/features/user/entities/user';
import Wallet from '@/features/wallets/entities/wallet';

// Bumped whenever the export shape changes in a way old importers wouldn't
// understand. The parser accepts older versions where it can.
export const USER_DATA_SCHEMA_VERSION = 1;

type UserDataExport = {
  schemaVersion: number;
  exportedAt: string;
  user: User;
  wallets: Wallet[];
  goals: Goal[];
  goalVersions: GoalVersion[];
  transactions: Transaction[];
  transactionEntries: TransactionEntry[];
  categories: Category[];
};

export default UserDataExport;
