import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

const reconcileLedger = async () => {
  // Step 1: Clear all documentDB data
  await documentDBUtil.wallet_list.clear();
  await documentDBUtil.goal_list.clear();
  await documentDBUtil.transaction_list.clear();

  // Step 2: Initialize all wallets from appDB
  const wallets = await appDBUtil.wallets
    .filter(w => w.deletedAt === "null" || w.deletedAt === null)
    .toArray();

  for (const wallet of wallets) {
    await documentDBUtil.wallet_list.add({
      id: wallet.id,
      name: wallet.name,
      currency: wallet.currency,
      currentAmount: 0,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    });
  }

  // Step 3: Initialize all goals from appDB
  const goals = await appDBUtil.goals
    .filter(g => g.deletedAt === "null" || g.deletedAt === null)
    .toArray();

  for (const goal of goals) {
    const goalVersion = (await appDBUtil.goal_versions
      .where("goalID").equals(goal.id)
      .filter(gv => gv.deletedAt === "null" || gv.deletedAt === null)
      .toArray())[0];

    if (goalVersion) {
      await documentDBUtil.goal_list.add({
        id: goal.id,
        versionID: goalVersion.id,
        name: goalVersion.name,
        targetAmount: goalVersion.targetAmount,
        savedAmount: 0,
        savedPercent: 0,
        remainingAmount: goalVersion.targetAmount,
        status: goal.status,
        currency: goalVersion.currency,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      });
    }
  }

  // Step 4: Process all transactions and recalculate balances
  const transactions = await appDBUtil.transactions
    .filter(t => t.deletedAt === "null" || t.deletedAt === null)
    .toArray();

  for (const transaction of transactions) {
    const transactionEntries = await appDBUtil.transaction_entries
      .where("transactionID").equals(transaction.id)
      .filter(te => te.deletedAt === "null" || te.deletedAt === null)
      .toArray();

    const transactionListItemTransactionEntries = [];

    for (const transactionEntry of transactionEntries) {
      let sourceName: string | null = null;

      // Process Wallet entries
      if (transactionEntry.sourceType === TransactionSourceType.Wallet && transactionEntry.sourceID) {
        const wallet = (await appDBUtil.wallets
          .where("id").equals(transactionEntry.sourceID)
          .toArray())[0];

        if (wallet) {
          sourceName = wallet.name;
          const walletListItem = await documentDBUtil.wallet_list.get(wallet.id);

          if (walletListItem) {
            const currentAmount = currencyUtil.parse(walletListItem.currentAmount, walletListItem.currency);
            const newAmount = transactionEntry.direction === "to"
              ? currentAmount.add(transactionEntry.amount)
              : currentAmount.subtract(transactionEntry.amount);

            await documentDBUtil.wallet_list.update(walletListItem.id, {
              currentAmount: newAmount.value
            });
          }
        }
      }
      // Process Goal entries
      else if (transactionEntry.sourceType === TransactionSourceType.Goal && transactionEntry.sourceID) {
        const goal = (await appDBUtil.goals
          .where("id").equals(transactionEntry.sourceID)
          .toArray())[0];

        if (goal) {
          const goalVersion = (await appDBUtil.goal_versions
            .where("goalID").equals(goal.id)
            .toArray())[0];

          if (goalVersion) {
            sourceName = goalVersion.name;
            const goalListItem = await documentDBUtil.goal_list.get(goal.id);

            if (goalListItem) {
              const amountDelta = transactionEntry.direction === "to"
                ? transactionEntry.amount
                : -transactionEntry.amount;

              const newSavedAmount = currencyUtil.parse(goalListItem.savedAmount, goalListItem.currency)
                .add(amountDelta);
              const newSavedPercent = newSavedAmount.multiply(100)
                .divide(goalListItem.targetAmount);
              const newRemainingAmount = currencyUtil.parse(goalListItem.targetAmount, goalListItem.currency)
                .subtract(newSavedAmount);

              await documentDBUtil.goal_list.update(goalListItem.id, {
                savedAmount: newSavedAmount.value,
                savedPercent: newSavedPercent.value,
                remainingAmount: newRemainingAmount.value,
              });
            }
          }
        }
      }

      transactionListItemTransactionEntries.push({
        type: transactionEntry.sourceType,
        sourceID: transactionEntry.sourceID,
        name: sourceName,
        currency: transactionEntry.currency,
        direction: transactionEntry.direction,
        amount: transactionEntry.amount,
      });
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
  }
};

export default reconcileLedger;
