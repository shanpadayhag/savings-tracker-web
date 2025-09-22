"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import { ComboboxItem } from '@/components/molecules/combobox';
import HomeGoalItemActionDropdown from '@/features/home/components/molecules/home-goal-item-action-dropdown';
import HomeMainActionSection from '@/features/home/components/organisms/home-main-action-section';
import HomeSpendMoneyDialog from '@/features/home/components/organisms/home-spend-money-dialog';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { db, num, User } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default () => {
  const states = useHomeStates();
  const events = useHomeEvents(states);

  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [newGoalDialogIsOpen, setNewGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState("eur");
  const [newBalanceDialogIsOpen, setNewBalanceDialogIsOpen] = useState(false);
  const [newBalanceAmount, setNewBalanceAmount] = useState("");
  const [newTransactionGoals, setNewTransactionGoals] = useState<{ goal?: ComboboxItem; amount: string; }[]>([]);

  const handleNewGoalFormOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createGoal();
  };

  const handleNewGoalButtonOnClick = () => {
    createGoal();
  };

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

  const createGoal = async () => {
    const today = new Date();
    const targetAmount = parseFloat(newGoalTargetAmount) || 0;

    await db.goalList.add({
      name: newGoalName,
      targetAmount: targetAmount,
      currentAmount: 0,
      status: 'active',
      createdAt: today,
      updatedAt: today
    });

    events.fetchGoals();
    setNewGoalDialogIsOpen(false);
    setNewGoalName("");
    setNewGoalTargetAmount("");
    setNewGoalCurrency("eur");
  };

  const handleAddBalanceButtonOnClick = () => {
    addBalance();
  };

  const handleAddBalanceFormOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addBalance();
  };

  const addBalance = async () => {
    const amount = parseFloat(newBalanceAmount) || 0;
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
    <div className="w-screen h-screen overflow-hidden bg-secondary">
      <div className="flex flex-col items-center overflow-auto h-full py-2">
        <HomeMainActionSection
          adjustBalanceOnClick={setNewBalanceDialogIsOpen}
          newGoalOnClick={setNewGoalDialogIsOpen}
          exportTransactionsOnClick={events.exportTransactionsOnClick}
          importTransactionsOnClick={events.importTransactionsOnClick} />

        <div className="flex flex-col gap-4 p-4 md:gap-6 w-full max-w-[500px]">
          {states.goalList.map(goal => <Card key={goal.id} className="flex-1">
            <CardHeader>
              <CardTitle className="self-center row-span-2">{goal.name}</CardTitle>
              <CardAction>
                <HomeGoalItemActionDropdown
                  allocateMoneyOnClick={states.setAllocateMoneyDialogIsOpen}
                  spendMoneyOnClick={states.setSpendMoneyDialogIsOpen}
                  setSelectedGoal={states.setSelectedGoal}
                  goal={{ id: goal.id!, name: goal.name }} />
              </CardAction>
            </CardHeader>

            <CardContent>
              <h3 className="text-3xl font-semibold">{num.currencyFormat(goal.targetAmount)}</h3>
              <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="mt-3 mb-2" />
              <p className="flex justify-between">
                <span className="font-semibold">
                  {num.currencyFormat(goal.currentAmount)}
                  <span className="text-muted-foreground text-sm font-normal"> saved so far</span>
                </span>

                <span>{num.currencyFormat((goal.currentAmount / goal.targetAmount) * 100, undefined, false)}%</span>
              </p>
            </CardContent>

            <CardFooter className="mt-2">
              <p className="flex justify-between w-full">
                <span className="text-sm">Remaining</span>
                <span className="text-sm font-semibold">{num.currencyFormat(goal.targetAmount - goal.currentAmount)}</span>
              </p>
            </CardFooter>
          </Card>)}
        </div>
      </div>

      <Dialog open={newGoalDialogIsOpen} onOpenChange={setNewGoalDialogIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create goal</DialogTitle>
            <DialogDescription>
              Enter your goal details here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleNewGoalFormOnSubmit} className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input onChange={event => setNewGoalName(event.target.value)} id="name-1" name="name" placeholder="Enter goal's name" autoComplete="off" />
            </div>

            <div className="flex gap-3">
              <div className="grid gap-3 flex-1">
                <Label htmlFor="target-amount">Target Amount</Label>
                <Input onChange={event => setNewGoalTargetAmount(event.target.value)} id="target-amount" name="target-amount" placeholder="Enter goal's target amount" autoComplete="off" />
              </div>

              <div className="grid gap-3 w-30">
                <Label htmlFor="currency">Currency</Label>
                <Input disabled value={newGoalCurrency} onChange={event => setNewGoalCurrency(event.target.value)} id="currency" name="currency" autoComplete="off" />
              </div>

              <button className="hidden" type="submit"></button>
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleNewGoalButtonOnClick}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HomeSpendMoneyDialog
        spendMoneyDialogIsOpen={states.spendMoneyDialogIsOpen}
        setSpendMoneyDialogIsOpen={states.setSpendMoneyDialogIsOpen}
        goalName={states.selectedGoal?.name || "Goal"}
        setDescription={states.setNewTransactionDescription}
        setAmount={states.setNewTransactionAmount}
        handleSpendFromGoal={events.handleSpendFromGoal} />

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
