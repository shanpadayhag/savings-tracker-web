import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Dexie from "dexie";
import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import User from '@/features/user/entities/user-old';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const num = {
  currencyFormat(amount: number, currency = "eur", showSymbol: boolean = true) {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    };

    if (showSymbol) {
      options.style = 'currency';
      options.currency = currency;
    }

    return new Intl.NumberFormat('en-US', options).format(amount);
  }
};

class DB extends Dexie {
  user!: Dexie.Table<User, "singleton">;
  goalList!: Dexie.Table<GoalListItem, string>;
  transactionList!: Dexie.Table<TransactionListItem, number>;

  constructor() {
    super("savings_tracker");
    this.version(2).stores({
      user: "id",
      goalList: "id, status, updatedAt",
      transactionList: "++id",
    });
  }
}

export const db = new DB();
