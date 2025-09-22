import TransactionType from '@/features/transactions/enums/transaction-type';

type TransactionListItem = {
  id?: number;
  type: TransactionType;
  activity: string;
  description: string;
  createdAt?: Date;
  accountAdjustment?: {
    amount: number;
  };
  goalActivity?: {
    goalID: string;
    amount: number;
  };
};

export default TransactionListItem;
