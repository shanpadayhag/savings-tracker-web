// Atomically replaces the appDB with a previously parsed import. Wraps every
// table clear + bulk insert in a single Dexie transaction so a midway failure
// rolls back to the pre-import state. Reconcile then rebuilds the document
// DB from the new source-of-truth tables (clearing them itself).

import UserDataExport from '@/features/user/entities/user-data-export';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import appDBUtil from '@/utils/app-db-util';

const importUserData = async (data: UserDataExport): Promise<void> => {
  await appDBUtil.transaction('rw', appDBUtil.tables, async () => {
    await Promise.all(appDBUtil.tables.map(table => table.clear()));

    await appDBUtil.users.add(data.user);
    if (data.wallets.length > 0) await appDBUtil.wallets.bulkAdd(data.wallets);
    if (data.goals.length > 0) await appDBUtil.goals.bulkAdd(data.goals);
    if (data.goalVersions.length > 0) await appDBUtil.goal_versions.bulkAdd(data.goalVersions);
    if (data.transactions.length > 0) await appDBUtil.transactions.bulkAdd(data.transactions);
    if (data.transactionEntries.length > 0) await appDBUtil.transaction_entries.bulkAdd(data.transactionEntries);
    if (data.categories.length > 0) await appDBUtil.categories.bulkAdd(data.categories);
  });

  await reconcileLedger();
};

export default importUserData;
