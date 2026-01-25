"use client";

import Currency from '@/enums/currency';
import createGoal from '@/features/goals/api/create-goal';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import allocateFundsToWallet from '@/features/transactions/api/allocate-funds-to-wallet';
import createWallet from '@/features/wallets/api/create-wallet';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';
import Dexie from 'dexie';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

enum GoalStatus {
  Active = 'active',
  Archived = 'archived',
  Completed = 'completed',
}

enum TransactionType {
  AccountAdjustment = "account_adjustment",
  GoalAllocation = "goal_allocation",
  GoalExpense = "goal_expense",
  GoalTransfer = "goal_transfer",
  GoalDeallocation = "goal_deallocation",
}

class DB extends Dexie {
  goalList!: Dexie.Table<{
    id?: string;
    groupID?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    status: GoalStatus;
    createdAt: Date;
    updatedAt: Date;
  }, string>;
  transactionList!: Dexie.Table<{
    id?: number;
    type: TransactionType;
    activity: string;
    description: string | null;
    createdAt?: Date;
    accountAdjustment?: {
      amount: number;
    };
    goalActivity?: {
      goalID: string;
      amount: number;
    };
  }, number>;

  constructor() {
    super("savings_tracker");
    this.version(2).stores({
      user: "id",
      goalList: "id, status, updatedAt",
      transactionList: "++id",
    });
  }
}

const tempDB = new DB();

export default () => {
  const searchParams = useSearchParams();
  const walletName = useMemo(() => (searchParams.get("wallet_name") || "Default"), []);
  const walletCurrency = useMemo(() => ((searchParams.get("wallet_currency") as Currency) || Currency.Euro), []);

  useEffect(() => {
    (async () => {
      await appDBUtil.wallets.clear();
      await documentDBUtil.wallet_list.clear();
      await appDBUtil.goals.clear();
      await appDBUtil.goal_versions.clear();
      await documentDBUtil.goal_list.clear();

      const walletID = await createWallet({
        name: walletName,
        currency: walletCurrency,
      });

      const goals = await tempDB.goalList.toCollection().toArray();
      for (const goal of goals) {
        await createGoal({
          name: goal.name,
          targetAmount: goal.targetAmount.toString(),
          status: goal.status,
          currency: walletCurrency,
          createdAt: goal.createdAt
        });
      }

      let currencyUtilParseFormatSetttings;
      if (walletCurrency === 'EURO') {
        currencyUtilParseFormatSetttings = { pattern: "#", negativePattern: "#", decimal: ',', separator: '.' };
      } else {
        currencyUtilParseFormatSetttings = { pattern: "#", negativePattern: "#", decimal: '.', separator: ',' };
      }

      const transactions = await tempDB.transactionList.toCollection().toArray();
      for (const transaction of transactions) {
        if (transaction.type === 'account_adjustment') {
          await allocateFundsToWallet({
            walletID: walletID,
            amount: currencyUtil.parse(transaction.accountAdjustment!.amount, walletCurrency).format(currencyUtilParseFormatSetttings),
            createdAt: new Date(transaction.createdAt!),
          });
        } else if (transaction.type === 'goal_allocation') {
        //   await allocateFundsToGoal({
        //     sourceID: walletID,
        //     destinationID: ,
        //     amount: currencyUtil.parse(transaction.accountAdjustment!.amount, walletCurrency).format(currencyUtilParseFormatSetttings),
        //     notes: transaction.description || '',
        //     createdAt: ,
        //   })
        } else { // goal_expense

        }
      }
    })();
  }, []);

  return "Transferring";
};
