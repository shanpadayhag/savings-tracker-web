"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import useAccountSettingsEvents from '@/features/settings/events/account-settings-events';
import useAccountSettingsStates from '@/features/settings/states/account-settings-states';

export default () => {
  const states = useAccountSettingsStates();
  const events = useAccountSettingsEvents(states);

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
  </div>;
};

// Data Management
//    - Recalculate All Totals
//      - This will re-process all transactions to ensure your totals are accurate. This may take a moment. Do you want to continue?
