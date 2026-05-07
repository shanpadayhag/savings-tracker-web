import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import Dexie from 'dexie';

type AllocateFundToGoalParams = {
  sourceID?: string;
  destinationID?: string;
  amount: string;
  notes: string;
  createdAt?: Date;
};

const allocateFundToGoal = async (params: AllocateFundToGoalParams) => {
  const sourceWallet = await appDBUtil.wallets.get(params.sourceID || "");
  if (!sourceWallet) throw new AppError(
    "Source Wallet Not Found... 🕵️",
    "We couldn't locate the wallet you are trying to pull funds from. Please select a valid wallet.");
  const destinationGoal = await appDBUtil.goals.get(params.destinationID || "");
  if (!destinationGoal) throw new AppError(
    "Goal Not Found... 🔭",
    "The goal you are trying to fund doesn't seem to exist anymore.");
  const destinationGoalVersion = await appDBUtil.goal_versions
    .where("[goalID+createdAt]").between(
      [destinationGoal.id, Dexie.minKey],
      [destinationGoal.id, Dexie.maxKey]
    ).last();
  if (!destinationGoalVersion) throw new AppError(
    "Goal History Missing 📉",
    "We found the goal, but we can't retrieve its currency details. Please try again.");
  const walletListItem = await documentDBUtil.wallet_list.get(sourceWallet.id);
  if (!walletListItem) throw new AppError(
    "Wallet Data Glitch 👾",
    "We found the wallet, but some details are missing. Please try refreshing or re-syncing.");
  if (walletListItem.currency !== destinationGoalVersion.currency)
    throw new AppError(
      "Currencies Don't Match 💱",
      "The wallet and the goal use different currencies. You can only allocate funds between matching currencies.");
  if (walletListItem.currentAmount < currencyUtil.parse(params.amount, destinationGoalVersion.currency).value)
    throw new AppError(
      "Short on Funds... 😬",
      "You don't have enough balance in this wallet for this transaction. Please lower the amount.");
  const goalListItem = await documentDBUtil.goal_list.get(destinationGoal.id);
  if (!goalListItem) throw new AppError(
    "Goal Data Glitch 🧩",
    "We see the goal, but the display data is incomplete. Please try refreshing.");
  const transactionAmount = currencyUtil.parse(params.amount, destinationGoalVersion.currency);
  if (transactionAmount.value <= 0) throw new AppError(
    "Need a Positive Amount! 🪙",
    "You can't allocate zero or negative funds to a goal. Please enter a value greater than zero.");

  // Default once at the top so every entry, transaction, and reversedCreatedAt
  // share the same instant — and the type system can rely on Date.
  const transactionTimestamp = params.createdAt ?? new Date();
  const transactionID = crypto.randomUUID();
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Wallet,
    sourceID: sourceWallet.id,
    direction: TransactionDirection.From,
    amount: transactionAmount.value,
    currency: sourceWallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Goal,
    sourceID: destinationGoal.id,
    direction: TransactionDirection.To,
    amount: transactionAmount.value,
    currency: sourceWallet.currency,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  };

  await appDBUtil.transactions.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: params.notes,
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
  });
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);
  await documentDBUtil.transaction_list.add({
    id: transactionID,
    type: TransactionType.Allocate,
    notes: params.notes,
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
      name: destinationGoalVersion.name,
      currency: destinationGoalVersion.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount
    }],
    createdAt: transactionTimestamp,
    updatedAt: transactionTimestamp,
    reversedCreatedAt: transactionTimestamp.getTime() * -1,
  });

  const sourceWalletCurrentAmount = currencyUtil.parse(
    walletListItem.currentAmount, walletListItem.currency)
    .subtract(transactionEntry1.amount);
  walletListItem.currentAmount = sourceWalletCurrentAmount.value;
  await documentDBUtil.wallet_list.put(walletListItem);

  const destinationGoalTargetAmount = currencyUtil.parse(
    goalListItem.targetAmount, goalListItem.currency);
  const destinationGoalSavedAmount = currencyUtil.parse(
    goalListItem.savedAmount, goalListItem.currency)
    .add(transactionEntry2.amount);
  const destinationGoalRemainingAmount = destinationGoalTargetAmount.subtract(destinationGoalSavedAmount);
  // Imported / legacy goals can have a 0 target. Mirror the reconciler and
  // emit 0% rather than NaN/Infinity.
  const destinationGoalSavedPercent = destinationGoalTargetAmount.value === 0
    ? 0
    : destinationGoalSavedAmount.multiply(100).divide(destinationGoalTargetAmount).value;
  goalListItem.savedAmount = destinationGoalSavedAmount.value;
  goalListItem.remainingAmount = destinationGoalRemainingAmount.value;
  goalListItem.savedPercent = destinationGoalSavedPercent;
  await documentDBUtil.goal_list.put(goalListItem);
};

export default allocateFundToGoal;
