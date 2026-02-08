import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import fetchUserData from '@/features/user/usecases/fetch-user-data';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import useAppCallback from '@/hooks/use-app-callback';
import dateUtil from '@/utils/date-util';

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

  const handleImport = useAppCallback(async () => {

    await reconcileLedger();
  }, []);

  return {
    handleReconcileLedger,
    handleExport,
    handleImport,
  };
};

export default useAccountSettingsEvents;
