import getTransactions from '@/features/transactions/usecases/get-transactions';

const reconcileLedger = async () => {
  const transactions = await getTransactions({ limit: 999999999 });
};

export default reconcileLedger;
