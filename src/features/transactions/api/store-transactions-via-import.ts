import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import { db } from '@/lib/utils';

type StoreTransactionsViaImportParams = {
  transactions: TransactionListItem[];
};

/**
 * Stores multiple transactions in the database using a single bulk operation.
 * @param {StoreTransactionsViaImportParams} params - The parameters for the import.
 * @param {TransactionListItem[]} params.transactions - The list of transactions to be stored.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const storeTransactionsViaImport = async ({
  transactions,
}: StoreTransactionsViaImportParams): Promise<void> => {
  await db.transactionList.bulkAdd(transactions);
};

export default storeTransactionsViaImport;
