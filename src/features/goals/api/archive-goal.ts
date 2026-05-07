import { AppError } from '@/errors/app-error';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type ArchiveGoalParameters = {
  goalID?: string;
  walletID?: string;
  createdAt?: Date;
};

const archiveGoal = async (params: ArchiveGoalParameters): Promise<void> => {
  const goal = await documentDBUtil.goal_list.get(params.goalID || "");
  if (!goal) throw new AppError(
    "Goal Not Found 🔍",
    "We couldn't find this goal. It may have been deleted. Please try refreshing your list.");
  if (goal.status === GoalStatus.Archived) throw new AppError(
    "Already Archived 📦",
    "This goal is already archived.");

  const wallet = await documentDBUtil.wallet_list.get(params.walletID || "");
  if (!wallet || !params.walletID) throw new AppError(
    "Pick a Wallet 👛",
    "Choose a wallet to receive the goal's remaining balance before archiving.");
  if (wallet.currency !== goal.currency) throw new AppError(
    "Currencies Don't Match 💱",
    "The wallet and the goal use different currencies. Please choose a wallet with the same currency as the goal.");

  const goalSavedAmount = currencyUtil.parse(goal.savedAmount, goal.currency);

  if (goalSavedAmount.value > 0) {
    const transactionID = crypto.randomUUID();
    const transactionEntry1 = {
      id: crypto.randomUUID(),
      transactionID: transactionID,
      sourceType: TransactionSourceType.Goal,
      sourceID: goal.id,
      direction: TransactionDirection.From,
      amount: goalSavedAmount.value,
      currency: goal.currency,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    };
    const transactionEntry2 = {
      id: crypto.randomUUID(),
      transactionID: transactionID,
      sourceType: TransactionSourceType.Wallet,
      sourceID: wallet.id,
      direction: TransactionDirection.To,
      amount: goalSavedAmount.value,
      currency: goal.currency,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    };

    await appDBUtil.transactions.add({
      id: transactionID,
      type: TransactionType.Deallocate,
      notes: null,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    });
    await appDBUtil.transaction_entries.add(transactionEntry1);
    await appDBUtil.transaction_entries.add(transactionEntry2);
    await documentDBUtil.transaction_list.add({
      id: transactionID,
      type: TransactionType.Deallocate,
      notes: null,
      entries: [{
        type: transactionEntry1.sourceType,
        sourceID: transactionEntry1.sourceID,
        name: goal.name,
        currency: goal.currency,
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
      updatedAt: params.createdAt,
      reversedCreatedAt: params?.createdAt
        ? params.createdAt.getTime() * -1
        : undefined
    });

    const walletNewCurrentAmount = currencyUtil.parse(wallet.currentAmount, wallet.currency)
      .add(goalSavedAmount.value);
    await documentDBUtil.wallet_list.update(wallet.id, {
      currentAmount: walletNewCurrentAmount.value,
    });

    const goalTargetAmount = currencyUtil.parse(goal.targetAmount, goal.currency);
    await documentDBUtil.goal_list.update(goal.id, {
      savedAmount: 0,
      savedPercent: 0,
      remainingAmount: goalTargetAmount.value,
    });
  }

  const statusChangedAt = params.createdAt ?? new Date();
  await appDBUtil.goals.update(goal.id, { status: GoalStatus.Archived, statusChangedAt });
  await documentDBUtil.goal_list.update(goal.id, { status: GoalStatus.Archived, statusChangedAt });
};

export default archiveGoal;
