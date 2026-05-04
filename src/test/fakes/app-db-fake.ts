import Category from '@/features/categories/entities/category';
import Goal from '@/features/goals/entities/goal';
import GoalVersion from '@/features/goals/entities/goal-version';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionEntry from '@/features/transactions/entities/transaction-entry';
import Wallet from '@/features/wallets/entities/wallet';
import InMemoryTable from '@/test/fakes/in-memory-table';

class CategoriesTable extends InMemoryTable<Category> {
  where(_field: 'name') {
    return {
      equalsIgnoreCase: (value: string) => ({
        first: async (): Promise<Category | undefined> =>
          this.list().find(category => category.name?.toLowerCase() === value.toLowerCase()),
      }),
    };
  }
}

class GoalVersionsTable extends InMemoryTable<GoalVersion> {
  where(_field: '[goalID+createdAt]') {
    return {
      between: (lower: [string, unknown], upper: [string, unknown]) => {
        const goalID = lower[0] === upper[0] ? lower[0] : null;
        const matches = goalID
          ? this.list().filter(version => version.goalID === goalID)
          : this.list();
        const sorted = [...matches].sort((a, b) => {
          const aTime = a.createdAt?.getTime() ?? 0;
          const bTime = b.createdAt?.getTime() ?? 0;
          return aTime - bTime;
        });
        return {
          last: async (): Promise<GoalVersion | undefined> => sorted[sorted.length - 1],
        };
      },
    };
  }
}

class AppDBFake {
  wallets = new InMemoryTable<Wallet>();
  goals = new InMemoryTable<Goal>();
  goal_versions = new GoalVersionsTable();
  transactions = new InMemoryTable<Transaction>();
  transaction_entries = new InMemoryTable<TransactionEntry>();
  categories = new CategoriesTable();

  reset(): void {
    this.wallets.reset();
    this.goals.reset();
    this.goal_versions.reset();
    this.transactions.reset();
    this.transaction_entries.reset();
    this.categories.reset();
  }
}

const appDBFake = new AppDBFake();
export default appDBFake;
