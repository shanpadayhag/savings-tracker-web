import Category from '@/features/categories/entities/category';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionType from '@/features/transactions/enums/transaction-type';
import currency from 'currency.js';

// Instead of accepting currency object,
// accept the properties with values instead
// This is to save memory. Example, instead
// of currency object, pass the properties you
// need instead like currencyObj.value and
// currencyObj.format()
//
// In this object instead of amount, it should be
// amountValue and amountFormat
type TransactionListItem = {
  id: Transaction['id'];
  type: TransactionType;
  from: string | null;
  to: string | null;
  amount: currency[];
  convertedAmount?: currency;
  fee: currency | null;
  notes: Transaction['notes'];
  /** Resolved category — the read-side resolver fills this with the system
   * "Others" entry whenever the underlying transaction has no categoryID,
   * so the UI can always render a badge. */
  category?: {
    id: Category['id'];
    name: Category['name'];
    color: Category['color'];
  };
  cancelledAt?: Date;
  reversedAt?: Date;
  reversalOfID?: Transaction['id'];
  /** IDs of every Goal this transaction touched on either side. Used by the
   * cancel control to look up live goal status — a Spend-from-goal whose
   * goal has since been completed or archived can no longer be cancelled. */
  goalSourceIDs?: string[];
  createdAt: Transaction['createdAt'];
  updatedAt: Transaction['updatedAt'];
};

export default TransactionListItem;
