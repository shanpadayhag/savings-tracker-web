import { AppError } from '@/errors/app-error';
import useTransactionsStates from '@/features/transactions/states/use-transactions-states';
import getTransactions, { TransactionPageCursor } from '@/features/transactions/usecases/get-transactions';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useTransactionsEvents = (states: ReturnType<typeof useTransactionsStates>) => {
  const loadTransactionPage = useCallback(async (cursor: TransactionPageCursor | null) => {
    states.setIsPageLoading(true);
    try {
      const page = await getTransactions({ cursor });
      states.setTransactions(page.items);
      states.setNextCursor(page.nextCursor ?? null);
      states.setPrevCursor(page.prevCursor ?? null);
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
    } finally {
      states.setIsPageLoading(false);
    }
  }, []);

  const handleFetchTransactions = useCallback(
    () => loadTransactionPage(null),
    [loadTransactionPage],
  );

  const handleFetchNextPage = useCallback(() => {
    if (!states.nextCursor) return;
    return loadTransactionPage(states.nextCursor);
  }, [states.nextCursor, loadTransactionPage]);

  const handleFetchPreviousPage = useCallback(() => {
    if (!states.prevCursor) return;
    return loadTransactionPage(states.prevCursor);
  }, [states.prevCursor, loadTransactionPage]);

  return {
    handleFetchTransactions,
    handleFetchNextPage,
    handleFetchPreviousPage,
  };
};

export default useTransactionsEvents;
