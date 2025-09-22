import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Dexie from "dexie";
import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';

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

/**
 * Currently there will be 1 whole total available funds. But when implementing
 * the actual database, please note that there will be an "acount" that will
 * act as a virtual wallet
 */
export type User = {
  id: "singleton";
  financialSummary: {
    totalAvailableFunds: number;
    currency: string;
    lastUpdated: Date;
  };
};

class DB extends Dexie {
  user!: Dexie.Table<User, "singleton">;
  goalList!: Dexie.Table<GoalListItem, string>;
  transactionList!: Dexie.Table<TransactionListItem, number>;

  constructor() {
    super("savings_tracker");
    this.version(1).stores({
      user: "id",
      goalList: "id, status",
      transactionList: "++id",
    });
  }
}

export const db = new DB();
