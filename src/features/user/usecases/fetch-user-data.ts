import fetchCurrentUser from '@/features/user/api/fetch-current-user';
import UserDataExport, { USER_DATA_SCHEMA_VERSION } from '@/features/user/entities/user-data-export';
import appDBUtil from '@/utils/app-db-util';

const fetchUserData = async (): Promise<UserDataExport> => {
  const [user, wallets, goals, goalVersions, transactions, transactionEntries, categories] = await Promise.all([
    fetchCurrentUser(),
    appDBUtil.wallets.toArray(),
    appDBUtil.goals.toArray(),
    appDBUtil.goal_versions.toArray(),
    appDBUtil.transactions.toArray(),
    appDBUtil.transaction_entries.toArray(),
    appDBUtil.categories.toArray(),
  ]);

  return {
    schemaVersion: USER_DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    user,
    wallets,
    goals,
    goalVersions,
    transactions,
    transactionEntries,
    categories,
  };
};

export default fetchUserData;
