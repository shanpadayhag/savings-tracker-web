import { AppError } from '@/errors/app-error';
import getTransactions from '@/features/transactions/usecases/get-transactions';
import useTransactionsStates from '@/features/transactions/states/use-transactions-states';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useTransactionsEvents = (states: ReturnType<typeof useTransactionsStates>) => {
  const handleFetchTransactions = useCallback(async () => {
    try {
      states.setTransactions((await getTransactions({})).items);
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
    }
  }, []);

  return {
    handleFetchTransactions,
  };
};

export default useTransactionsEvents;
