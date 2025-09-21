import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import { db } from '@/lib/utils';

const TRANSACTION_FETCH_LIMIT = 250000;

/**
 * An async generator that yields chunks of transactions from the database.
 * This is memory-efficient for exporting large datasets.
 */
async function* getTransactionChunksForExport(): AsyncGenerator<TransactionListItem[]> {
  let lastId = 0;
  let transactionsChunk: TransactionListItem[];

  do {
    transactionsChunk = await db.transactionList
      .where('id').above(lastId)
      .limit(TRANSACTION_FETCH_LIMIT)
      .toArray();

    if (transactionsChunk.length > 0) {
      lastId = transactionsChunk[transactionsChunk.length - 1].id!;
      yield transactionsChunk;
    }
  } while (transactionsChunk.length > 0);
}

export default getTransactionChunksForExport;
