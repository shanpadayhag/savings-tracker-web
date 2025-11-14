"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/tabs';
import HomeDialogCurrentBalance from '@/features/home/components/molecules/home-dialog-current-balance';
import HomeAllocateMoneyDialog from '@/features/home/components/organisms/home-allocate-money-dialog';
import HomeArchiveGoalDialog from '@/features/home/components/organisms/home-archive-goal-dialog';
import HomeCreateGoalDialog from '@/features/home/components/organisms/home-create-goal-dialog';
import HomeGoalTable from '@/features/home/components/organisms/home-goal-table';
import HomeMainActionSection from '@/features/home/components/organisms/home-main-action-section';
import HomeResetAccountConfirmationDialog from '@/features/home/components/organisms/home-reset-account-confirmation-dialog';
import HomeSpendMoneyDialog from '@/features/home/components/organisms/home-spend-money-dialog';
import HomeTransactionsTable from '@/features/home/components/organisms/home-transactions-table';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useState } from 'react';

export default () => {
  const states = useHomeStates();
  const events = useHomeEvents(states);

  const [newBalanceDialogIsOpen, setNewBalanceDialogIsOpen] = useState(false);
  const [newBalanceAmount, setNewBalanceAmount] = useState("");

  const handleAddBalanceButtonOnClick = () => {
    addBalance();
  };

  const handleAddBalanceFormOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addBalance();
  };

  const addBalance = async () => {
    const amount = currencyUtil.parse(newBalanceAmount).value;
    const today = new Date;

    if (amount === 0) {
      alert("Amount is invalid");
      return;
    }

    if (!states.authUser) {
      alert("Something went wrong, reload the page. if persists contact dev");
      return;
    }

    const transaction: TransactionListItem = {
      createdAt: today,
      type: TransactionType.AccountAdjustment,
      activity: `Allocated ${amount} euro for account balance`,
      description: "Allocation for account balance",
      accountAdjustment: {
        amount: amount,
      },
    };

    states.authUser.financialSummary.totalAvailableFunds += amount;
    states.authUser.financialSummary.lastUpdated = today;

    db.user.update("singleton", states.authUser);
    states.setAuthUser({ ...states.authUser });
    db.transactionList.add(transaction);

    setNewBalanceDialogIsOpen(false);
    setNewBalanceAmount("");
  };

  useEffect(() => {
    events.handleFetchGoals();
    events.handleFetchAuthUser();
    events.handleFetchTransactions();
  }, []);

  return <>
    <div className="w-screen h-screen overflow-hidden bg-background">
      <div className="flex flex-col items-center overflow-auto h-full py-2">
        <HomeMainActionSection
          adjustBalanceOnClick={setNewBalanceDialogIsOpen}
          setCreateGoalDialogIsOpen={states.setCreateGoalDialogIsOpen}
          setResetDialogIsOpen={states.setResetDialogIsOpen}
          exportTransactionsOnClick={events.exportTransactionsOnClick}
          importTransactionsOnClick={events.importTransactionsOnClick} />

        <Tabs className="w-full gap-3" defaultValue="goals">
          <TabsList className="mx-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="goals">
            <HomeGoalTable
              goalList={states.goalList}
              setAllocateMoneyDialogIsOpen={states.setAllocateMoneyDialogIsOpen}
              setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
              setArchiveGoalDialogIsOpen={states.setArchiveGoalDialogIsOpen}
              setSelectedGoal={states.setSelectedGoal}
              selectedGoal={states.selectedGoal} />
          </TabsContent>
          <TabsContent value="transactions">
            <HomeTransactionsTable
              transactionList={states.transactionList} />
          </TabsContent>
        </Tabs>
      </div>

      <HomeCreateGoalDialog
        createGoalDialogIsOpen={states.createGoalDialogIsOpen}
        setCreateGoalDialogIsOpen={states.setCreateGoalDialogIsOpen}
        handleCreateGoal={events.handleCreateGoal}
        setNewGoalName={states.setNewGoalName}
        setNewGoalTargetAmount={states.setNewGoalTargetAmount} />

      <HomeSpendMoneyDialog
        spendMoneyDialogIsOpen={states.spendMoneyDialogIsOpen}
        setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
        goalName={states.selectedGoal?.name || "Goal"}
        currentBalance={states.selectedGoal?.currentAmount}
        setDescription={states.setNewTransactionDescription}
        setAmount={states.setNewTransactionAmount}
        handleSpendFromGoal={events.handleSpendFromGoal} />

      <HomeAllocateMoneyDialog
        allocateMoneyDialogIsOpen={states.allocateMoneyDialogIsOpen}
        setAllocateMoneyDialogIsOpen={states.setAllocateMoneyDialogIsOpen}
        goalName={states.selectedGoal?.name || "Goal"}
        currentBalance={states.authUser?.financialSummary.totalAvailableFunds}
        setDescription={states.setNewTransactionDescription}
        setAmount={states.setNewTransactionAmount}
        handleAllocateFromGoal={events.handleAllocateFromGoal} />

      <HomeResetAccountConfirmationDialog
        resetDialogIsOpen={states.resetDialogIsOpen}
        setResetDialogIsOpen={states.setResetDialogIsOpen}
        handleResetAccount={events.handleResetAccount} />

      <HomeArchiveGoalDialog
        archiveGoalDialogIsOpen={states.archiveGoalDialogIsOpen}
        setArchiveGoalDialogIsOpen={states.setArchiveGoalDialogIsOpen}
        selectedGoal={states.selectedGoal}
        handleArchiveGoal={events.handleArchiveGoal} />

      <Dialog open={newBalanceDialogIsOpen} onOpenChange={setNewBalanceDialogIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update balance</DialogTitle>
            <DialogDescription>
              Enter your details here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBalanceFormOnSubmit} className="grid gap-4">
            <HomeDialogCurrentBalance
              currentBalance={states.authUser?.financialSummary.totalAvailableFunds} />

            <div className="grid gap-3">
              <Label htmlFor="amount">Amount</Label>
              <Input onChange={event => setNewBalanceAmount(event.target.value)} id="amount" name="amount" placeholder="Enter amount" autoComplete="off" />
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddBalanceButtonOnClick} type="submit">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  </>;
};

// import { ChartAreaInteractive } from "@/features/dashboard/components/molecules/chart-area-interactive";
// import { DataTable } from "@/features/dashboard/components/molecules/data-table";
// import { SectionCards } from "@/features/dashboard/components/molecules/section-cards";

// import data from "./data.json";
// import { SiteHeader } from '@/features/dashboard/components/molecules/site-header';

// export default function Page() {
//   return (
//     <>
//       <SiteHeader />
//       <div className="flex flex-1 flex-col">
//         <div className="@container/main flex flex-1 flex-col gap-2">
//           <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
//             <SectionCards />
//             <div className="px-4 lg:px-6">
//               <ChartAreaInteractive />
//             </div>
//             <DataTable data={data} />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
