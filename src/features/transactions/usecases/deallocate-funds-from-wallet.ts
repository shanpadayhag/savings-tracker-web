import { AppError } from '@/errors/app-error';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type DeallocateFundsFromWalletParams = {
  walletID?: Wallet['id'];
  notes: Transaction['notes'];
  amount: string;
  createdAt?: Date;
};

const deallocateFundsFromWallet = async (params: DeallocateFundsFromWalletParams) => {
  const wallet = await documentDBUtil.wallet_list.get(params.walletID || "");
  if (!wallet || !params.walletID) throw new AppError(
    "Hmm, Wallet Not Found... 🧐",
    "We couldn't find this wallet. It may have been deleted. Please try refreshing your list.");

  const paramsAmount = currencyUtil.parse(params.amount, wallet.currency);
  if (paramsAmount.value <= 0) throw new AppError(
    "Check That Amount 🤔",
    "Please enter an amount greater than zero to defund this wallet.");

  const walletCurrentAmount = currencyUtil.parse(wallet.currentAmount, wallet.currency);
  const newCurrentAmount = walletCurrentAmount.subtract(paramsAmount);
  if (newCurrentAmount.value < 0) throw new AppError(
    "Wallet is a Little Short 🤏",
    "This wallet doesn't have enough funds to cover this refund. Please adjust the amount or allocate more funds first.");

  // Default once at the top so every related row shares the same instant.
  const transactionTimestamp = params.createdAt ?? new Date();
  const transaction = {
    id: crypto.randomUUID(),
    type: TransactionType.Deallocate,
    notes: params.notes?.trim() || null,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.Wallet,
    sourceID: wallet.id,
    direction: TransactionDirection.From,
    amount: paramsAmount.value,
    currency: wallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.To,
    amount: paramsAmount.value,
    currency: wallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };

  await appDBUtil.transactions.add(transaction);
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);

  await documentDBUtil.transaction_list.add({
    id: transaction.id,
    type: transaction.type,
    notes: transaction.notes,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: wallet.name,
      currency: wallet.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: null,
      currency: wallet.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
    reversedCreatedAt: transactionTimestamp.getTime() * -1,
  });

  await documentDBUtil.wallet_list.update(wallet.id, {
    currentAmount: newCurrentAmount.value,
  });
};

export default deallocateFundsFromWallet;
