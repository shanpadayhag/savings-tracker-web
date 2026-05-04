import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type TransferFundsBetweenGoalsParams = {
  sourceID?: string;
  destinationID?: string;
  amount: string;
  notes: string;
  createdAt?: Date;
};

const transferFundsBetweenGoals = async (params: TransferFundsBetweenGoalsParams) => {
  if (!params.sourceID || !params.destinationID) throw new AppError(
    "Pick Both Goals 🎯",
    "Choose the goal you're transferring from and the goal you're transferring to.");
  if (params.sourceID === params.destinationID) throw new AppError(
    "Same Goal Twice 🌀",
    "The source and destination goals must be different. Please pick another goal.");

  const sourceGoal = await documentDBUtil.goal_list.get(params.sourceID);
  if (!sourceGoal) throw new AppError(
    "Source Goal Not Found 🔍",
    "We couldn't find the goal you're pulling funds from. Please try refreshing your list.");

  const destinationGoal = await documentDBUtil.goal_list.get(params.destinationID);
  if (!destinationGoal) throw new AppError(
    "Destination Goal Not Found 🔭",
    "The goal you're transferring to doesn't seem to exist anymore.");

  if (sourceGoal.currency !== destinationGoal.currency) throw new AppError(
    "Currencies Don't Match 💱",
    "Both goals must use the same currency to transfer funds.");

  const transferAmount = currencyUtil.parse(params.amount, sourceGoal.currency);
  if (transferAmount.value <= 0) throw new AppError(
    "Need a Positive Amount! 🪙",
    "You can't transfer zero or negative funds. Please enter a value greater than zero.");

  const sourceSavedAmount = currencyUtil.parse(sourceGoal.savedAmount, sourceGoal.currency);
  const newSourceSavedAmount = sourceSavedAmount.subtract(transferAmount);
  if (newSourceSavedAmount.value < 0) throw new AppError(
    "Goal is a Little Short 🤏",
    "The source goal doesn't have enough funds for this transfer. Lower the amount or fund the goal first.");

  const transactionID = crypto.randomUUID();
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Goal,
    sourceID: sourceGoal.id,
    direction: TransactionDirection.From,
    amount: transferAmount.value,
    currency: sourceGoal.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transactionID,
    sourceType: TransactionSourceType.Goal,
    sourceID: destinationGoal.id,
    direction: TransactionDirection.To,
    amount: transferAmount.value,
    currency: destinationGoal.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };

  await appDBUtil.transactions.add({
    id: transactionID,
    type: TransactionType.Transfer,
    notes: params.notes?.trim() || null,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  });
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);
  await documentDBUtil.transaction_list.add({
    id: transactionID,
    type: TransactionType.Transfer,
    notes: params.notes?.trim() || null,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: sourceGoal.name,
      currency: sourceGoal.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: destinationGoal.name,
      currency: destinationGoal.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    reversedCreatedAt: params?.createdAt
      ? params.createdAt.getTime() * -1
      : undefined
  });

  const sourceTargetAmount = currencyUtil.parse(sourceGoal.targetAmount, sourceGoal.currency);
  const sourceRemainingAmount = sourceTargetAmount.subtract(newSourceSavedAmount);
  const sourceSavedPercent = newSourceSavedAmount.multiply(100).divide(sourceTargetAmount);
  await documentDBUtil.goal_list.update(sourceGoal.id, {
    savedAmount: newSourceSavedAmount.value,
    savedPercent: sourceSavedPercent.value,
    remainingAmount: sourceRemainingAmount.value,
  });

  const destinationTargetAmount = currencyUtil.parse(destinationGoal.targetAmount, destinationGoal.currency);
  const newDestinationSavedAmount = currencyUtil.parse(destinationGoal.savedAmount, destinationGoal.currency)
    .add(transferAmount);
  const destinationRemainingAmount = destinationTargetAmount.subtract(newDestinationSavedAmount);
  const destinationSavedPercent = newDestinationSavedAmount.multiply(100).divide(destinationTargetAmount);
  await documentDBUtil.goal_list.update(destinationGoal.id, {
    savedAmount: newDestinationSavedAmount.value,
    savedPercent: destinationSavedPercent.value,
    remainingAmount: destinationRemainingAmount.value,
  });
};

export default transferFundsBetweenGoals;
