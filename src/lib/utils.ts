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

export type User = {
  id: "singleton";
  financialSummary: {
    totalAvailableFunds: number;
    currency: string;
    lastUpdated: Date;
  };
}

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
};

class DB extends Dexie {
  user!: Dexie.Table<User, "singleton">;
  goalList!: Dexie.Table<GoalListItem, number>;
  transactionList!: Dexie.Table<TransactionListItem, number>;

  constructor() {
    super("savings_tracker");
    this.version(1).stores({
      goalList: "++id",
      transactionList: "++id",
    });
  }
}

export const db = new DB();
