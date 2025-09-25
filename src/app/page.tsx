"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import HomeAllocateMoneyDialog from '@/features/home/components/organisms/home-allocate-money-dialog';
import HomeCreateGoalDialog from '@/features/home/components/organisms/home-create-goal-dialog';
import HomeGoalTable from '@/features/home/components/organisms/home-goal-table';
import HomeMainActionSection from '@/features/home/components/organisms/home-main-action-section';
import HomeSpendMoneyDialog from '@/features/home/components/organisms/home-spend-money-dialog';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db, num, User } from '@/lib/utils';
import { currencyUtil } from '@/utils/currency-util';
import { useEffect, useState } from 'react';

export default () => {
  const states = useHomeStates();
  const events = useHomeEvents(states);

  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [newBalanceDialogIsOpen, setNewBalanceDialogIsOpen] = useState(false);
  const [newBalanceAmount, setNewBalanceAmount] = useState("");

  const handleOnPageLoad = async () => {
    fetchUserDetails();
    events.fetchGoals();
  };

  const fetchUserDetails = async () => {
    const user = await db.user.get("singleton");

    if (!user) {
      const today = new Date();
      const user: User = {
        id: 'singleton',
        financialSummary: {
          totalAvailableFunds: 0,
          currency: 'eur',
          lastUpdated: today
        }
      };

      await db.user.add({
        id: 'singleton',
        financialSummary: {
          totalAvailableFunds: 0,
          currency: 'eur',
          lastUpdated: today
        }
      });
      setUserDetails(user);
    } else {
      setUserDetails(user);
    }
  };

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

    if (!userDetails) {
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

    userDetails!.financialSummary.totalAvailableFunds += amount;
    userDetails!.financialSummary.lastUpdated = today;

    db.user.update("singleton", userDetails);
    setUserDetails({ ...userDetails! });
    db.transactionList.add(transaction);

    setNewBalanceDialogIsOpen(false);
    setNewBalanceAmount("");
  };

  useEffect(() => {
    handleOnPageLoad();
  }, []);

  return <>
    <div className="w-screen h-screen overflow-hidden bg-background">
      <div className="flex flex-col items-center overflow-auto h-full py-2">
        <HomeMainActionSection
          adjustBalanceOnClick={setNewBalanceDialogIsOpen}
          setCreateGoalDialogIsOpen={states.setCreateGoalDialogIsOpen}
          exportTransactionsOnClick={events.exportTransactionsOnClick}
          importTransactionsOnClick={events.importTransactionsOnClick} />

        <HomeGoalTable
          goalList={states.goalList}
          setAllocateMoneyDialogIsOpen={states.setAllocateMoneyDialogIsOpen}
          setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
          setSelectedGoal={states.setSelectedGoal}
          selectedGoal={states.selectedGoal} />
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
        setDescription={states.setNewTransactionDescription}
        setAmount={states.setNewTransactionAmount}
        handleSpendFromGoal={events.handleSpendFromGoal} />

      <HomeAllocateMoneyDialog
        allocateMoneyDialogIsOpen={states.allocateMoneyDialogIsOpen}
        setAllocateMoneyDialogIsOpen={states.setAllocateMoneyDialogIsOpen}
        goalName={states.selectedGoal?.name || "Goal"}
        setDescription={states.setNewTransactionDescription}
        setAmount={states.setNewTransactionAmount}
        handleAllocateFromGoal={events.handleAllocateFromGoal} />

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
            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground">Current Balance:</p>
              <h3 className="text-2xl font-semibold">{num.currencyFormat(userDetails?.financialSummary.totalAvailableFunds || 0, userDetails?.financialSummary.currency || "eur")}</h3>
            </div>

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
