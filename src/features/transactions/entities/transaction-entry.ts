import Currency from '@/enums/currency';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';

type TransactionEntry = {
  id: string;
  transactionID: Transaction['id'];
  sourceType: TransactionSourceType;
  sourceID: string | null;
  direction: TransactionDirection;
  amount: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default TransactionEntry;
