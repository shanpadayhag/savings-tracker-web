import { AppError } from '@/errors/app-error';
import cancelTransaction from '@/features/transactions/api/cancel-transaction';
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

  const handleConfirmCancelTransaction = useCallback(async (transactionID: string) => {
    try {
      await cancelTransaction({ transactionID });
      // Refresh from the start. The user's pagination position is lost on
      // purpose — a cancelled row's neighbors may have shifted, and the user
      // almost always wants to verify the result on the most recent page.
      await loadTransactionPage(null);
      toast.success("Transaction cancelled");
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
    }
  }, [loadTransactionPage]);

  return {
    handleFetchTransactions,
    handleFetchNextPage,
    handleFetchPreviousPage,
    handleConfirmCancelTransaction,
  };
};

export default useTransactionsEvents;
