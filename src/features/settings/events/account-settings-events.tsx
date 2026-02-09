import JsonObj from '@/configs/types/json';
import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import fetchUserData from '@/features/user/usecases/fetch-user-data';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import useAppCallback from '@/hooks/use-app-callback';
import appDBUtil from '@/utils/app-db-util';
import dateUtil from '@/utils/date-util';
import documentDBUtil from '@/utils/document-db-util';
import { useCallback } from 'react';

const useAccountSettingsEvents = (states: ReturnType<typeof useAccountSettingsStates>) => {
  const handleReconcileLedger = useAppCallback(async () => {
    await reconcileLedger();
  }, []);

  const handleExport = useAppCallback(async () => {
    const timestamp = dateUtil.toTimestampString();
    const baseFilename = `savings_tracker_${timestamp}`;
    const userData = await fetchUserData();
    const jsonString = JSON.stringify(userData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseFilename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(async (userData: JsonObj) => {
    await documentDBUtil.transaction("rw", documentDBUtil.tables, async () => {
      await Promise.all(documentDBUtil.tables.map((table) => table.clear()));
    });

    await appDBUtil.transaction('rw', appDBUtil.tables, async () => {
      await Promise.all(appDBUtil.tables.map((table) => table.clear()));

      const parseDates = <T extends unknown>(
        items: any[], dateFields: string[]
      ): T[] => items.map(item => {
        const parsed = { ...item };
        dateFields.forEach(field => {
          if (parsed[field] && parsed[field] !== "null") {
            parsed[field] = new Date(parsed[field]);
          }
        });
        return parsed;
      });

      await appDBUtil.users.add(userData.user);
      await appDBUtil.wallets.bulkAdd(parseDates(userData.wallets, ["createdAt", "updatedAt", "deletedAt"]));
      await appDBUtil.goals.bulkAdd(parseDates(userData.goals, ["createdAt", "updatedAt", "deletedAt"]));
      await appDBUtil.goal_versions.bulkAdd(parseDates(userData.goalVersions, ["createdAt", "updatedAt", "deletedAt"]));
      await appDBUtil.transactions.bulkAdd(parseDates(userData.transactions, ["createdAt", "updatedAt", "deletedAt"]));
      await appDBUtil.transaction_entries.bulkAdd(parseDates(userData.transactionEntries, ["createdAt", "updatedAt", "deletedAt"]));
    });

    await reconcileLedger();
  }, []);

  return {
    handleReconcileLedger,
    handleExport,
    handleImport,
  };
};

export default useAccountSettingsEvents;
