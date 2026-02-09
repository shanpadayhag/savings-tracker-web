"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import JsonObj from '@/configs/types/json';
import useAccountSettingsEvents from '@/features/settings/events/account-settings-events';
import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import { useCallback } from 'react';
import { toast } from 'sonner';

export default () => {
  const states = useAccountSettingsStates();
  const events = useAccountSettingsEvents(states);

  const importButtonOnClick = useCallback(() => {
    states.importFileInputRef.current?.click();
  }, [states.importFileInputRef]);

  const importFileInputOnChange = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const json: JsonObj = JSON.parse(await file.text());
      events.handleImport(json);
    } catch {
      toast.error("Invalid JSON File 📄", {
        description: "The selected file contains invalid JSON. Please fix the format and try again.",
      });
    }

    event.target.value = '';
  }, []);

  return <div className="flex flex-col gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Reconcile Ledger</CardTitle>
        <CardDescription>Recalculate all transaction history to ensure balance accuracy. Use this if you see discrepancies.</CardDescription>
      </CardHeader>

      <CardFooter className="justify-end">
        <Button onClick={events.handleReconcileLedger}>Reconcile</Button>
      </CardFooter>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export your data for backup, or import data from another source.
        </CardDescription>
      </CardHeader>

      <CardFooter className="justify-end gap-2">
        <Button onClick={events.handleExport} variant="secondary">Export</Button>
        <Button onClick={importButtonOnClick} variant="destructive">Import</Button>
        <input onChange={importFileInputOnChange} ref={states.importFileInputRef} type="file" id="jsonFileInput" accept=".json" hidden />
      </CardFooter>
    </Card>
  </div>;
};
