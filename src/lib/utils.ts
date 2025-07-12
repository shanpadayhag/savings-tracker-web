import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Dexie from "dexie";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const num = {
  currencyFormat(amount: number, currency: string, showSymbol: boolean = true) {
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

export type GoalListItem = {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  currency: string; // usd, euro, php
  status: string; // active, archived, completed
  createdAt: Date;
  updatedAt: Date;
};

export type TransactionListItem = {
  id?: number;
  date?: Date;
  type: string; // goal_allocation, account_balance_adjustment
  activity: string;
  description: string;
  accountBalanceAdjustment?: {
    amount: number;
  };
  goalAllocation?: {
    goal: {
      id: number;
      name: string;
    };
    amountAllocated: number;
  }[];
};

class DB extends Dexie {
  user!: Dexie.Table<User, "singleton">;
  // goal_allocations!: Dexie.Table<GoalAllocation, number>;
  goalList!: Dexie.Table<GoalListItem, number>;
  transactionList!: Dexie.Table<TransactionListItem, number>;

  constructor() {
    super("savings_tracker");
    this.version(1).stores({
      user: "id",
      goalList: "++id",
      transactionList: "++id",
    });
  }
}

export const db = new DB();
