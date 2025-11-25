import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import currency from 'currency.js';

const isSystemType = (type: TransactionEntry['sourceType']) =>
  type === TransactionSourceType.Internal ||
  type === TransactionSourceType.External;

const getTransactions = async (): Promise<TransactionListItem[]> => {
  const transactionList = await documentDBUtil.transaction_list
    .reverse().sortBy('createdAt');

  return transactionList.map(transactionListItem => {
    const entries = transactionListItem.entries;

    const mainFrom: currency[] = [];
    const mainTo: currency[] = [];
    const fees: currency[] = [];

    let fromName: string | null = null;
    let toName: string | null = null;

    for (const entry of entries) {
      const amountParsed = currencyUtil.parse(entry.amount, entry.currency);

      if (entry.type === TransactionSourceType.Internal &&
        entry.direction === TransactionDirection.To) {
        fees.push(amountParsed);
        continue;
      }

      if (isSystemType(entry.type)) {
        continue;
      }

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
};


export default getTransactions;
