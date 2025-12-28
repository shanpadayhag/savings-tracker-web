import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import currency from 'currency.js';
import Dexie from 'dexie';

type Cursor = {
  createdAt: Date;
  id: TransactionListItem['id'];
  direction: 'next' | 'prev';
};

type GetTransactionsParams = {
  date?: Date | [Date, Date];
  limit?: number;
  cursor?: Cursor | null;
};

type GetTransactionsResult = {
  items: TransactionListItem[];
  prevCursor?: Cursor | null;
  nextCursor?: Cursor | null;
};

const isSystemType = (type: TransactionEntry['sourceType']) =>
  type === TransactionSourceType.Internal ||
  type === TransactionSourceType.External;

const getTransactions = async (params: GetTransactionsParams): Promise<GetTransactionsResult> => {
  const direction = params.cursor?.direction || "next";
  const collection = await documentDBUtil.transaction_list
    .where("[createdAt+id]");

  let query;
  if (params.cursor && params.cursor.direction === "prev") {
    query = collection.between(
      [Dexie.minKey, Dexie.minKey],
      [params.cursor.createdAt, params.cursor.id],
      true, false
    ).reverse();
  }
  else {
    query = collection.between(
      params.cursor
        ? [params.cursor.createdAt, params.cursor.id]
        : [Dexie.minKey, Dexie.minKey],
      [Dexie.maxKey, Dexie.maxKey],
      !params.cursor, true
    );
  }

  const limit = params.limit || 25;
  const rawTransactionList = await query.limit(limit + 1).toArray();
  const hasMore = rawTransactionList.length > limit;
  let nextCursor: Cursor | null = null;
  let prevCursor: Cursor | null = null;

  if (hasMore) rawTransactionList.pop();
  if (direction === 'prev') rawTransactionList.reverse();

  const transactionList = rawTransactionList.map(transactionListItem => {
    const entries = transactionListItem.entries;

    const mainFrom: currency[] = [];
    const mainTo: currency[] = [];
    const fees: currency[] = [];

    let fromName: string | null = null;
    let toName: string | null = null;

    for (const entry of entries) {
      if (entry.type === TransactionSourceType.Internal &&
        entry.direction === TransactionDirection.To) {
        fees.push(currencyUtil.parse(entry.amount, entry.currency));
        continue;
      }

      if (isSystemType(entry.type)) {
        continue;
      }

      const amountParsed = currencyUtil.parse(entry.amount, entry.currency);

      if (entry.direction === TransactionDirection.From) {
        mainFrom.push(amountParsed);
        fromName = entry.name;
      }

      if (entry.direction === TransactionDirection.To) {
        mainTo.push(amountParsed);
        toName = entry.name;
      }
    }

    const amount = [...mainFrom, ...mainTo];

    return {
      id: transactionListItem.id,
      type: transactionListItem.type,
      from: fromName,
      to: toName,
      amount: amount,
      convertedAmount: undefined,
      fee: fees.length ? fees[0] : null,
      notes: transactionListItem.notes,
      createdAt: transactionListItem.createdAt,
      updatedAt: transactionListItem.updatedAt,
    };
  }) as TransactionListItem[];

  if (direction === 'next') {
    const hasNext = hasMore;
    const hasPrev = !!params.cursor;
    if (hasNext) {
      nextCursor = {
        createdAt: rawTransactionList[rawTransactionList.length - 1].createdAt!,
        id: rawTransactionList[rawTransactionList.length - 1].id,
        direction: "next",
      };
    }
    if (hasPrev) {
      prevCursor = {
        createdAt: rawTransactionList[0].createdAt!,
        id: rawTransactionList[0].id,
        direction: "prev",
      };
    }
  }

  if (direction === 'prev') {
    const hasNext = !!params.cursor;
    const hasPrev = hasMore;
    if (hasNext) {
      nextCursor = {
        createdAt: rawTransactionList[rawTransactionList.length - 1].createdAt!,
        id: rawTransactionList[rawTransactionList.length - 1].id!,
        direction: "next",
      };
    }
    if (hasPrev) {
      prevCursor = {
        createdAt: rawTransactionList[0].createdAt!,
        id: rawTransactionList[0].id!,
        direction: "prev",
      };
    }
  }

  if (!params.cursor && direction === 'next') {
    prevCursor = null;
  }

  return { items: transactionList, prevCursor, nextCursor };
};


export default getTransactions;
