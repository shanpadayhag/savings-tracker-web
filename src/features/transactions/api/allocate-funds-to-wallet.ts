import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';
import currency from 'currency.js';

type AllocateFundsToWalletParams = {
  sourceID?: string;
  amount: string;
};

const allocateFundsToWallet = async (params: AllocateFundsToWalletParams) => {
  const allocatedAmount = currency(params.amount);

  if (!params.sourceID) throw new AppError(
    "Hmm, Wallet Not Found... 🧐",
    "The wallet you're trying to send funds from doesn't seem to exist. Please check your selection and try again.");
  const wallet = await documentDBUtil.wallet_list.get(params.sourceID);

  if (allocatedAmount.value <= 0) throw new AppError(
    "Whoops, Check That Amount! 🤔",
    "To allocate funds, the amount needs to be a positive number. Please enter a value greater than zero.");
  if (!wallet) throw new AppError(
    "Hmm, Wallet Not Found... 🧐",
    "The wallet you're trying to send funds from doesn't seem to exist. Please check your selection and try again.");

  const transactionID = crypto.randomUUID();
  const now = new Date();
  const transactionEntry1: TransactionEntry = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.From,
    amount: allocatedAmount.multiply(-1).value,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null"
  };
  const transactionEntry2: TransactionEntry = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Wallet,
    sourceID: params.sourceID,
    direction: TransactionDirection.To,
    amount: allocatedAmount.value,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null"
  };

  await appDBUtil.transactions.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null"
  });
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);
  await documentDBUtil.transaction_list.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: null,
    entries: [{
      type: transactionEntry1.sourceType,
      id: transactionEntry1.sourceID,
      name: null,
      currency: wallet.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      id: transactionEntry2.sourceID,
      name: wallet.name,
      currency: wallet.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    createdAt: now,
    updatedAt: now
  });

  documentDBUtil.wallet_list.update(params.sourceID, {
    currentAmount: currency(wallet.currentAmount).add(transactionEntry2.amount).value
  });
};

export default allocateFundsToWallet;
