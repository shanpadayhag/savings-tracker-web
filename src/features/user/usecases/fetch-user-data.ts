import JsonObj from '@/configs/types/json';
import getGoalVersions from '@/features/goals/api/get-goal-versions';
import getGoals from '@/features/goals/api/get-goals';
import getTransactionEntries from '@/features/transactions/api/get-transaction-entries';
import getTransactions from '@/features/transactions/api/get-transactions';
import fetchCurrentUser from '@/features/user/api/fetch-current-user';
import getWallets from '@/features/wallets/api/get-wallets';

const fetchUserData = async () => {
  const userData: JsonObj = {};

  userData.user = await fetchCurrentUser();
  userData.wallets = await getWallets();
  userData.goals = await getGoals();
  userData.goalVersions = await getGoalVersions();
  userData.transactions = await getTransactions();
  userData.transactionEntries = await getTransactionEntries();

  return userData;
};

export default fetchUserData;
