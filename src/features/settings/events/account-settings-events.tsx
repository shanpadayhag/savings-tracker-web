import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import useAppCallback from '@/hooks/use-app-callback';

const useAccountSettingsEvents = (states: ReturnType<typeof useAccountSettingsStates>) => {
  const handleReconcileLedger = useAppCallback(async () => {
    await reconcileLedger();
  }, []);

  return {
    handleReconcileLedger,
  };
};

export default useAccountSettingsEvents;
