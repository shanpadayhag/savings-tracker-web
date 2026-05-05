import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import fetchUserData from '@/features/user/usecases/fetch-user-data';
import importUserData from '@/features/user/usecases/import-user-data';
import parseUserDataImport from '@/features/user/usecases/parse-user-data-import';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import useAppCallback from '@/hooks/use-app-callback';
import dateUtil from '@/utils/date-util';
import { toast } from 'sonner';

const useAccountSettingsEvents = (states: ReturnType<typeof useAccountSettingsStates>) => {
  const handleReconcileLedger = useAppCallback(async () => {
    await reconcileLedger();
    toast.success("Ledger Reconciled ✅", {
      description: "Balances and the activity log have been rebuilt from your transactions.",
    });
  }, []);

  const handleExport = useAppCallback(async () => {
    const userData = await fetchUserData();
    const filename = `savings_tracker_${dateUtil.toTimestampString()}.json`;
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toast.success("Export Ready 💾", {
      description: `Saved as ${filename}.`,
    });
  }, []);

  // Stage 1 of the import flow: parse + validate the file, then open a
  // confirmation dialog. Nothing in the DB is touched yet — a malformed file
  // surfaces an error toast without destroying anything.
  const handlePrepareImport = useAppCallback(async (file: File) => {
    const text = await file.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      toast.error("Invalid JSON File 📄", {
        description: "The selected file isn't valid JSON. Please pick a different file.",
      });
      return;
    }
    const parsed = parseUserDataImport(raw);
    states.setPendingImport(parsed);
    states.setPendingImportFileName(file.name);
    states.setImportDialogIsOpen(true);
  }, [states.setPendingImport, states.setPendingImportFileName, states.setImportDialogIsOpen]);

  // Stage 2 of the import flow: actually replace the appDB and rebuild the
  // document DB. Runs only after the user confirms in the dialog.
  const handleConfirmImport = useAppCallback(async () => {
    if (!states.pendingImport) return;
    states.setIsImporting(true);
    try {
      await importUserData(states.pendingImport);
      states.setImportDialogIsOpen(false);
      states.setPendingImport(undefined);
      states.setPendingImportFileName(undefined);
      toast.success("Import Complete 📦", {
        description: "Your data was replaced and balances were rebuilt.",
      });
    } finally {
      states.setIsImporting(false);
    }
  }, [
    states.pendingImport,
    states.setImportDialogIsOpen,
    states.setPendingImport,
    states.setPendingImportFileName,
    states.setIsImporting,
  ]);

  return {
    handleReconcileLedger,
    handleExport,
    handlePrepareImport,
    handleConfirmImport,
  };
};

export default useAccountSettingsEvents;
