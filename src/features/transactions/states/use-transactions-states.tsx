import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { TransactionPageCursor } from '@/features/transactions/usecases/get-transactions';
import { useState } from 'react';

export type TransactionTypeFilter = 'all' | TransactionType;

const useTransactionsStates = () => {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [hideCancelled, setHideCancelled] = useState(false);
  const [nextCursor, setNextCursor] = useState<TransactionPageCursor | null>(null);
  const [prevCursor, setPrevCursor] = useState<TransactionPageCursor | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [cancelTargetID, setCancelTargetID] = useState<string | null>(null);
  const [cancelDialogIsOpen, setCancelDialogIsOpen] = useState(false);

  return {
    transactions, setTransactions,
    typeFilter, setTypeFilter,
    hideCancelled, setHideCancelled,
    nextCursor, setNextCursor,
    prevCursor, setPrevCursor,
    isPageLoading, setIsPageLoading,
    cancelTargetID, setCancelTargetID,
    cancelDialogIsOpen, setCancelDialogIsOpen,
  };
};

export default useTransactionsStates;
