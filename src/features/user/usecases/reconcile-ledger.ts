import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

// will improve the logic in the future. this is only quick solution
const reconcileLedger = async () => {
  await documentDBUtil.wallet_list.toCollection().modify({ currentAmount: 0 });
  await documentDBUtil.goal_list.toCollection().modify({
    savedAmount: 0,
    savedPercent: 0,
    remainingAmount: 0,
  });
  documentDBUtil.transaction_list.clear();
  const transactions = await appDBUtil.transactions.toArray();
  let transactionListItemTransactionEntries = [];
  let goalOrWallet = null;
  let goal = null;
  let walletListItem = null;
  let goalListItem = null;

  for (const transaction of transactions) {
    const transactionEntries = await appDBUtil.transaction_entries
      .where("transactionID").equals(transaction.id).toArray();

    for (const transactionEntry of transactionEntries) {
      if (transactionEntry.sourceType === TransactionSourceType.Wallet) {
        if (transactionEntry.sourceID) {
          goalOrWallet = (await appDBUtil.wallets
            .where("id").equals(transactionEntry.sourceID)
            .toArray())[0];

          if (transactionEntry.direction === "to") {
            walletListItem = await documentDBUtil.wallet_list.get(goalOrWallet.id);
            if (walletListItem) {
              await documentDBUtil.wallet_list.update(walletListItem.id, {
                currentAmount: currencyUtil.parse(walletListItem.currentAmount, walletListItem.currency)
                  .add(transactionEntry.amount).value
              });
            }
            walletListItem = null;
          } else if (transactionEntry.direction === "from") { // else is okay here
            walletListItem = await documentDBUtil.wallet_list.get(goalOrWallet.id);
            if (walletListItem) {
              await documentDBUtil.wallet_list.update(walletListItem.id, {
                currentAmount: currencyUtil.parse(walletListItem.currentAmount, walletListItem.currency)
                  .subtract(transactionEntry.amount).value
              });
            }
            walletListItem = null;
          }
        }
      } else if (transactionEntry.sourceType === TransactionSourceType.Goal) {
        if (transactionEntry.sourceID) {
          goal = (await appDBUtil.goals
            .where("id").equals(transactionEntry.sourceID)
            .toArray())[0];

          if (goal) {
            goalOrWallet = (await appDBUtil.goal_versions
              .where("goalID").equals(goal.id)
              .toArray())[0];

            goalListItem = await documentDBUtil.goal_list.get(goal.id);
            if (goalListItem && transactionEntry.direction === "to") {
              const newSavedAmount = currencyUtil.parse(transactionEntry.amount, goalListItem.currency)
                .add(goalListItem.savedAmount);
              const newSavedPercent = newSavedAmount.divide(goalListItem.targetAmount)
                .multiply(100);
              const newRemainingAmount = newSavedAmount.subtract(goalListItem.targetAmount)
                .multiply(-1);

              await documentDBUtil.goal_list.update(goalListItem.id, {
                savedAmount: newSavedAmount.value,
                savedPercent: newSavedPercent.value,
                remainingAmount: newRemainingAmount.value,
              });
            } else if (goalListItem && transactionEntry.direction === "from") {
              const newSavedAmount = currencyUtil.parse(transactionEntry.amount, goalListItem.currency)
                .multiply(-1)
                .add(goalListItem.savedAmount);
              const newSavedPercent = newSavedAmount.divide(goalListItem.targetAmount)
                .multiply(100);
              const newRemainingAmount = newSavedAmount.subtract(goalListItem.targetAmount)
                .multiply(-1);

              await documentDBUtil.goal_list.update(goalListItem.id, {
                savedAmount: newSavedAmount.value,
                savedPercent: newSavedPercent.value,
                remainingAmount: newRemainingAmount.value,
              });
            }
            goalListItem = null;
          }
        }
      }

      transactionListItemTransactionEntries.push({
        type: transactionEntry.sourceType,
        sourceID: transactionEntry.sourceID,
        name: goalOrWallet?.name || null,
        currency: transactionEntry.currency,
        direction: transactionEntry.direction,
        amount: transactionEntry.amount,
      });

      goalOrWallet = null;
      goal = null;
    }

    await documentDBUtil.transaction_list.add({
      id: transaction.id,
      type: transaction.type,
      notes: transaction.notes,
      entries: transactionListItemTransactionEntries,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      reversedCreatedAt: (transaction.createdAt || new Date()).getTime() * -1,
    });
    transactionListItemTransactionEntries = [] as any;
  }
};

export default reconcileLedger;
