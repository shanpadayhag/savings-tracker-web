import JsonObj from '@/configs/types/json';
import fetchCurrentUser from '@/features/user/api/fetch-current-user';
import getWallets from '@/features/wallets/api/get-wallets';

const fetchUserData = async () => {
  const userData: JsonObj = {};

  const user = await fetchCurrentUser();
  userData.user.id = user.id;
  const wallets = await getWallets();
  userData.wallets = wallets;

  // fetch goals
  // fetch goal_versions
  // fetch transactions
  // fetch transaction_entries

  return userData;
};

export default fetchUserData;
