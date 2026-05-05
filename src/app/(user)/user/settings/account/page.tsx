"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { useCurrentUser } from '@/contexts/current-user-context';
import useAccountSettingsEvents from '@/features/settings/events/account-settings-events';
import useAccountSettingsStates from '@/features/settings/states/account-settings-states';
import { IconAlertTriangle, IconDatabaseExport, IconDatabaseImport, IconRefresh } from '@tabler/icons-react';
import { FormEvent, ReactNode, useCallback, useEffect } from 'react';

type ActionRowProps = {
  icon: ReactNode;
  iconClassName?: string;
  title: string;
  description: string;
  children: ReactNode;
};

const ActionRow = ({ icon, iconClassName, title, description, children }: ActionRowProps) => (
  <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div className="flex items-start gap-4">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClassName ?? 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="shrink-0 sm:ml-auto">{children}</div>
  </div>
);

export default () => {
  const states = useAccountSettingsStates();
  const events = useAccountSettingsEvents(states);
  const { initials, displayName } = useCurrentUser();

  useEffect(() => {
    events.handleLoadProfile();
  }, []);

  const profileFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleSaveProfile();
  }, [events.handleSaveProfile]);

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

  return <div className="flex flex-col gap-12">
    <header>
      <h1 className="heading-display text-3xl font-semibold lg:text-4xl">Account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Personal details, workspace maintenance, and data control.</p>
    </header>

    <section className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Profile</p>
        <h2 className="heading-display mt-1 text-xl font-semibold tracking-tight">Personal details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How you appear in the sidebar and across the app.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <form onSubmit={profileFormOnSubmit} className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="relative flex size-20 items-center justify-center rounded-2xl bg-foreground text-background"
              aria-hidden="true">
              <span className="numeral-hero text-2xl font-semibold tracking-tight">{initials}</span>
            </div>
            <p className="text-center text-xs text-muted-foreground lg:text-left">
              {displayName === 'Your Account' ? 'Add your name to personalize the avatar.' : displayName}
            </p>
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>First name</Label>
              <Input
                value={states.profileFirstName}
                onChange={event => states.setProfileFirstName(event.target.value)}
                placeholder="First name" />
            </div>

            <div className="grid gap-2">
              <Label>Last name</Label>
              <Input
                value={states.profileLastName}
                onChange={event => states.setProfileLastName(event.target.value)}
                placeholder="Last name" />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={states.profileEmail}
                onChange={event => states.setProfileEmail(event.target.value)}
                placeholder="you@example.com" />
              <p className="text-xs text-muted-foreground">
                Stored locally for now. Syncs with your account once the online version ships.
              </p>
            </div>
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
          <Button onClick={events.handleSaveProfile} disabled={states.isSavingProfile}>
            {states.isSavingProfile ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </section>

    <section className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Workspace</p>
        <h2 className="heading-display mt-1 text-xl font-semibold tracking-tight">Maintenance &amp; backups</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Repair derived balances or export a snapshot of everything you've recorded.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ActionRow
          icon={<IconRefresh className="size-5" />}
          title="Reconcile ledger"
          description="Recalculate every wallet and goal balance from the underlying transaction history. Safe to run any time you suspect a discrepancy.">
          <Button onClick={events.handleReconcileLedger} variant="outline">Reconcile</Button>
        </ActionRow>

        <ActionRow
          icon={<IconDatabaseExport className="size-5" />}
          title="Export data"
          description="Download a full JSON snapshot of your wallets, goals, transactions, and categories.">
          <Button onClick={events.handleExport} variant="outline">Export JSON</Button>
        </ActionRow>
      </div>
    </section>

    <section className="flex flex-col gap-6">
      <div>
        <p className="eyebrow text-rose-700 dark:text-rose-400">Danger zone</p>
        <h2 className="heading-display mt-1 text-xl font-semibold tracking-tight">Replace all data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Importing a JSON file erases everything you have now and rebuilds from the file. Export first if you want a way back.
        </p>
      </div>

      <ActionRow
        icon={<IconAlertTriangle className="size-5" />}
        iconClassName="bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400"
        title="Import from file"
        description="Pick a previously exported JSON file. You'll see a summary and confirmation prompt before anything is written.">
        <Button onClick={importButtonOnClick} variant="destructive">
          <IconDatabaseImport className="size-4" /> Import JSON
        </Button>
      </ActionRow>

      <input onChange={importFileInputOnChange} ref={states.importFileInputRef} type="file" id="jsonFileInput" accept=".json" hidden />
    </section>

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
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="eyebrow">Incoming snapshot</p>
            <p className="mt-1 text-sm tabular-nums">{pendingSummary}</p>
          </div>
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
