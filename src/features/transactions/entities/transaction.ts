import Category from '@/features/categories/entities/category';
import TransactionType from '@/features/transactions/enums/transaction-type';

type Transaction = {
  id: string;
  type: TransactionType;
  notes: string | null;
  /** Optional category tag. Missing = treated as the system "Others" row at
   * read time, so historical (pre-feature) transactions stay valid. */
  categoryID?: Category['id'];
  /** Same-calendar-day soft cancellation. Excluded from totals but kept in
   * the audit log. Mutually exclusive with `reversedAt` — a row is one or
   * the other, never both. */
  cancelledAt?: Date;
  /** Older cancellations leave the original alone and append an offsetting
   * transaction. The original gets `reversedAt` stamped so the UI can mark
   * it as reversed without losing its place in the time series. */
  reversedAt?: Date;
  /** Set on the offsetting reversal transaction, points back at the row it
   * reverses. The original keeps a clean `reversalOfID === undefined`. */
  reversalOfID?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | "null";
};

export default Transaction;
