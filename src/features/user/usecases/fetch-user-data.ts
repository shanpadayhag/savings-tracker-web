import JsonObj from '@/configs/types/json';
import fetchCurrentUser from '@/features/user/api/fetch-current-user';

const fetchUserData = async () => {
  const userData: JsonObj = {};

  const user = await fetchCurrentUser();
  userData.user.id = user.id;

  // fetch wallets
  // fetch goals
  // fetch goal_versions
  // fetch transactions
  // fetch transaction_entries

  return userData
};

export default fetchUserData;
