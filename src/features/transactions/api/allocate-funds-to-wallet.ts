import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type AllocateFundsToWalletParams = {
  walletID?: string;
  amount: string;
  createdAt?: Date;
};

const allocateFundsToWallet = async (params: AllocateFundsToWalletParams) => {
  const wallet = await documentDBUtil.wallet_list.get(params.walletID || "");
  if (!wallet || !params.walletID) throw new AppError(
    "Hmm, Wallet Not Found... 🧐",
    "The wallet you're trying to send funds from doesn't seem to exist. Please check your selection and try again.");

  const allocatedAmount = currencyUtil.parse(params.amount, wallet.currency);
  if (allocatedAmount.value <= 0) throw new AppError(
    "Whoops, Check That Amount! 🤔",
    "To allocate funds, the amount needs to be a positive number. Please enter a value greater than zero.");

  const transactionID = crypto.randomUUID();
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.From,
    amount: allocatedAmount.value,
    currency: wallet.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Wallet,
    sourceID: params.walletID,
    direction: TransactionDirection.To,
    amount: allocatedAmount.value,
    currency: wallet.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };

  await appDBUtil.transactions.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: null,
    createdAt: params?.createdAt,
    updatedAt: params.createdAt,
  });
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);
  await documentDBUtil.transaction_list.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: null,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: null,
      currency: wallet.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: wallet.name,
      currency: wallet.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    createdAt: params.createdAt,
    reversedCreatedAt: params?.createdAt
      ? params.createdAt.getTime() * -1
      : undefined
  });

  documentDBUtil.wallet_list.update(params.walletID, {
    currentAmount: currencyUtil.parse(wallet.currentAmount, wallet.currency)
      .add(transactionEntry2.amount).value
  });
};

export default allocateFundsToWallet;
