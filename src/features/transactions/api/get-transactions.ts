import appDBUtil from '@/utils/app-db-util';

const getTransactions = async () => {
  return appDBUtil.transactions.toArray();
};

export default getTransactions;
