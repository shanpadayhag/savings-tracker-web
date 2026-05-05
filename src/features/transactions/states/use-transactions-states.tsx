import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { useState } from 'react';

export type TransactionTypeFilter = 'all' | TransactionType;

const useTransactionsStates = () => {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');

  return {
    transactions, setTransactions,
    typeFilter, setTypeFilter,
  };
};

export default useTransactionsStates;
