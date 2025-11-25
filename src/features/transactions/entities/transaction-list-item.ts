import Transaction from '@/features/transactions/entities/transaction';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currency from 'currency.js';

type TransactionListItem = {
  id?: Transaction['id'];
  type: TransactionType;
  from: string | null;
  to: string | null;
  amount: currency[];
  convertedAmount?: currency;
  fee: currency | null;
  notes: Transaction['notes'];
  createdAt: Transaction['createdAt'];
  updatedAt: Transaction['updatedAt'];
};

export default TransactionListItem;
