import { db } from '@/lib/utils';

const resetAccount = async () => {
  db.user.update("singleton", {
    financialSummary: {
      currency: "eur",
      lastUpdated: new Date(),
      totalAvailableFunds: 0,
    }
  });

  db.transactionList.clear();
  db.goalList.clear();
}

export default resetAccount;
