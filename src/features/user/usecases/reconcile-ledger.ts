import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';

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

  for (const transaction of transactions) {
    const transactionEntries = await appDBUtil.transaction_entries
      .where("transactionID").equals(transaction.id).toArray();

    for (const transactionEntry of transactionEntries) {
      if (transactionEntry.sourceType === TransactionSourceType.Wallet) {
        if (transactionEntry.sourceID) {
          goalOrWallet = (await appDBUtil.wallets
            .where("id").equals(transactionEntry.sourceID)
            .toArray())[0];
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

    console.log(transaction.createdAt);
    console.log((transaction.createdAt || new Date()).getTime() * -1);
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
