import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';

const getTransactions = async () => {
  const desiredTypes = [
    TransactionType.GoalAllocation,
    TransactionType.GoalExpense,
    TransactionType.GoalTransfer,
    TransactionType.GoalDeallocation,
  ];

  return await db.transactionList.reverse()
    .filter(transaction => desiredTypes.includes(transaction.type))
    .limit(10).toArray();
};

export default getTransactions;
