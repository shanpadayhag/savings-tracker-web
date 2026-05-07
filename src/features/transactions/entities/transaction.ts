import Category from '@/features/categories/entities/category';
import TransactionType from '@/features/transactions/enums/transaction-type';

type Transaction = {
  id: string;
  type: TransactionType;
  notes: string | null;
  /** Optional category tag. Missing = treated as the system "Others" row at
   * read time, so historical (pre-feature) transactions stay valid. */
  categoryID?: Category['id'];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | "null";
};

export default Transaction;
