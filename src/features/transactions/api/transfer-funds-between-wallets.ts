import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type TransferFundsBetweenWalletsParams = {
  sourceID?: string;
  destinationID?: string;
  amount: string;
  fee: string;
  notes: string;
  createdAt?: Date;
};

const transferFundsBetweenWallets = async (params: TransferFundsBetweenWalletsParams) => {
  if (!params.sourceID || !params.destinationID) throw new AppError(
    "Pick Both Wallets 👛",
    "Choose the wallet you're sending from and the wallet you're receiving into.");
  if (params.sourceID === params.destinationID) throw new AppError(
    "Same Wallet Twice 🌀",
    "The source and destination wallets must be different. Please pick another wallet.");

  const sourceWallet = await documentDBUtil.wallet_list.get(params.sourceID);
  if (!sourceWallet) throw new AppError(
    "Source Wallet Not Found 🕵️",
    "We couldn't find the wallet you're transferring from. Please try refreshing your list.");

  const destinationWallet = await documentDBUtil.wallet_list.get(params.destinationID);
  if (!destinationWallet) throw new AppError(
    "Destination Wallet Not Found 🔭",
    "The wallet you're transferring to doesn't seem to exist anymore.");

  if (sourceWallet.currency !== destinationWallet.currency) throw new AppError(
    "Currencies Don't Match 💱",
    "Both wallets must use the same currency for a bank transfer. Use Convert Money instead.");

  const amount = currencyUtil.parse(params.amount, sourceWallet.currency);
  if (amount.value <= 0) throw new AppError(
    "Need a Positive Amount! 🪙",
    "The transfer amount must be greater than zero.");

  const fee = currencyUtil.parse(params.fee || "0", sourceWallet.currency);
  if (fee.value < 0) throw new AppError(
    "Fees Can't Be Negative 🚫",
    "The transfer fee can't be a negative number. Use zero if there's no fee.");

  const totalDebit = amount.add(fee);
  const sourceCurrentAmount = currencyUtil.parse(sourceWallet.currentAmount, sourceWallet.currency);
  if (sourceCurrentAmount.value < totalDebit.value) throw new AppError(
    "Short on Funds... 😬",
    "Your source wallet doesn't have enough to cover the transfer amount and fee.");

  // Default once at the top so every related row shares the same instant.
  const transactionTimestamp = params.createdAt ?? new Date();
  const transactionID = crypto.randomUUID();
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Wallet,
    sourceID: sourceWallet.id,
    direction: TransactionDirection.From,
    amount: amount.value,
    currency: sourceWallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Wallet,
    sourceID: destinationWallet.id,
    direction: TransactionDirection.To,
    amount: amount.value,
    currency: destinationWallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const feeEntry = fee.value > 0
    ? {
      id: crypto.randomUUID(),
      transactionID: transactionID,
      sourceType: TransactionSourceType.Internal,
      sourceID: null,
      direction: TransactionDirection.To,
      amount: fee.value,
      currency: sourceWallet.currency,
      createdAt: transactionTimestamp,
      updatedAt: transactionTimestamp,
    }
    : null;

  await appDBUtil.transactions.add({
    id: transactionID,
    type: TransactionType.Transfer,
    notes: params.notes?.trim() || null,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  });
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);
  if (feeEntry) await appDBUtil.transaction_entries.add(feeEntry);
  await documentDBUtil.transaction_list.add({
    id: transactionID,
    type: TransactionType.Transfer,
    notes: params.notes?.trim() || null,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: sourceWallet.name,
      currency: sourceWallet.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: destinationWallet.name,
      currency: destinationWallet.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }, ...(feeEntry ? [{
      type: feeEntry.sourceType,
      sourceID: feeEntry.sourceID,
      name: null,
      currency: feeEntry.currency,
      direction: feeEntry.direction,
      amount: feeEntry.amount,
    }] : [])],
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
    reversedCreatedAt: transactionTimestamp.getTime() * -1,
  });

  await documentDBUtil.wallet_list.update(sourceWallet.id, {
    currentAmount: sourceCurrentAmount.subtract(totalDebit).value,
  });

  const destinationCurrentAmount = currencyUtil.parse(destinationWallet.currentAmount, destinationWallet.currency);
  await documentDBUtil.wallet_list.update(destinationWallet.id, {
    currentAmount: destinationCurrentAmount.add(amount).value,
  });
};

export default transferFundsBetweenWallets;
