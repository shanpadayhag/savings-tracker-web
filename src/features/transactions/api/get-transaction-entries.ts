import appDBUtil from '@/utils/app-db-util';

const getTransactionEntries = async () => {
  return appDBUtil.transaction_entries.toArray();
};

export default getTransactionEntries;
