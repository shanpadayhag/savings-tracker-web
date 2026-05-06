import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { TransactionPageCursor } from '@/features/transactions/usecases/get-transactions';
import { useState } from 'react';

export type TransactionTypeFilter = 'all' | TransactionType;

const useTransactionsStates = () => {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [nextCursor, setNextCursor] = useState<TransactionPageCursor | null>(null);
  const [prevCursor, setPrevCursor] = useState<TransactionPageCursor | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);

  return {
    transactions, setTransactions,
    typeFilter, setTypeFilter,
    nextCursor, setNextCursor,
    prevCursor, setPrevCursor,
    isPageLoading, setIsPageLoading,
  };
};

export default useTransactionsStates;
