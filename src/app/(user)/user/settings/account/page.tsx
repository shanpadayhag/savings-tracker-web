"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import useAccountSettingsEvents from '@/features/settings/events/account-settings-events';
import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import { useCallback } from 'react';

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
    event.target.value = '';
    if (!file) return;
    await events.handlePrepareImport(file);
  }, [events.handlePrepareImport]);

  const pendingSummary = states.pendingImport && [
    `${states.pendingImport.wallets.length} wallets`,
    `${states.pendingImport.goals.length} goals`,
    `${states.pendingImport.transactions.length} transactions`,
    `${states.pendingImport.categories.length} categories`,
  ].join(' · ');

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
          Export your data for backup, or import data from another source. Importing replaces everything you have now.
        </CardDescription>
      </CardHeader>

      <CardFooter className="justify-end gap-2">
        <Button onClick={events.handleExport} variant="secondary">Export</Button>
        <Button onClick={importButtonOnClick} variant="destructive">Import</Button>
        <input onChange={importFileInputOnChange} ref={states.importFileInputRef} type="file" id="jsonFileInput" accept=".json" hidden />
      </CardFooter>
    </Card>

    <Dialog open={states.importDialogIsOpen} onOpenChange={open => {
      if (!open && !states.isImporting) {
        states.setPendingImport(undefined);
        states.setPendingImportFileName(undefined);
      }
      states.setImportDialogIsOpen(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace your data?</DialogTitle>
          <DialogDescription>
            Importing <span className="font-medium">{states.pendingImportFileName}</span> will erase your current wallets, goals, transactions, and categories, and replace them with the file's contents.
          </DialogDescription>
        </DialogHeader>

        {pendingSummary && (
          <p className="text-sm text-muted-foreground">{pendingSummary}</p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={states.isImporting}>Cancel</Button>
          </DialogClose>
          <Button onClick={events.handleConfirmImport} variant="destructive" disabled={states.isImporting}>
            {states.isImporting ? 'Importing…' : 'Replace data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
};
