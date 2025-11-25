import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import { useState } from 'react';

const useTransactionsStates = () => {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);

  return {
    transactions, setTransactions,
  }
}

export default useTransactionsStates;
