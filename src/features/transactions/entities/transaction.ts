import TransactionType from '@/features/transactions/enums/transaction-type';

type Transaction = {
  id: string;
  type: TransactionType;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default Transaction;
