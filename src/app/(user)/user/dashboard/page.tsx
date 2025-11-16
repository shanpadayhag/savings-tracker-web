"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/tabs';
import DashboardDialogCurrentBalance from '@/features/dashboard/components/molecules/dashboard-dialog-current-balance';
import DashboardAllocateMoneyDialog from '@/features/dashboard/components/organisms/dashboard-allocate-money-dialog';
import HomeArchiveGoalDialog from '@/features/dashboard/components/organisms/home-archive-goal-dialog';
import HomeCompleteGoalDialog from '@/features/dashboard/components/organisms/home-complete-goal-dialog';
import HomeCreateGoalDialog from '@/features/dashboard/components/organisms/home-create-goal-dialog';
import DashboardGoalTable from '@/features/dashboard/components/organisms/dashboard-goal-table';
import HomeMainActionSection from '@/features/dashboard/components/organisms/home-main-action-section';
import HomeResetAccountConfirmationDialog from '@/features/dashboard/components/organisms/home-reset-account-confirmation-dialog';
import DashboardSpendMoneyDialog from '@/features/dashboard/components/organisms/dashboard-spend-money-dialog';
import DashboardTransactionsTable from '@/features/dashboard/components/organisms/dashboard-transactions-table';
import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db } from '@/lib/utils';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useState } from 'react';
import Currency from '@/enums/currency';

export default () => {
  const states = useDashboardStates();
  const events = useDashboardEvents(states);

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
    const amount = currencyUtil.parse(newBalanceAmount, states.authUser?.financialSummary.currency || Currency.Euro).value;
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
    <div className="flex flex-col items-center overflow-auto h-full pb-2">
      <div className="w-full flex px-4 py-2">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Dashboard</h1>
      </div>

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
          <DashboardGoalTable
            authUser={states.authUser}
            goalList={states.goalList}
            setAllocateMoneyDialogIsOpen={states.setAllocateMoneyDialogIsOpen}
            setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
            setArchiveGoalDialogIsOpen={states.setArchiveGoalDialogIsOpen}
            setCompleteGoalDialogIsOpen={states.setCompleteGoalDialogIsOpen}
            setSelectedGoal={states.setSelectedGoal}
            selectedGoal={states.selectedGoal} />
        </TabsContent>
        <TabsContent value="transactions">
          <DashboardTransactionsTable
            authUser={states.authUser}
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

    <DashboardSpendMoneyDialog
      authUser={states.authUser}
      spendMoneyDialogIsOpen={states.spendMoneyDialogIsOpen}
      setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
      goalName={states.selectedGoal?.name || "Goal"}
      currentBalance={states.selectedGoal?.currentAmount}
      setDescription={states.setNewTransactionDescription}
      setAmount={states.setNewTransactionAmount}
      handleSpendFromGoal={events.handleSpendFromGoal} />

    <DashboardAllocateMoneyDialog
      authUser={states.authUser}
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
      authUser={states.authUser}
      archiveGoalDialogIsOpen={states.archiveGoalDialogIsOpen}
      setArchiveGoalDialogIsOpen={states.setArchiveGoalDialogIsOpen}
      selectedGoal={states.selectedGoal}
      handleArchiveGoal={events.handleArchiveGoal} />

    <HomeCompleteGoalDialog
      completeGoalDialogIsOpen={states.completeGoalDialogIsOpen}
      setCompleteGoalDialogIsOpen={states.setCompleteGoalDialogIsOpen}
      selectedGoal={states.selectedGoal}
      handleCompleteGoal={events.handleCompleteGoal} />

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
          <DashboardDialogCurrentBalance
            authUser={states.authUser}
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
