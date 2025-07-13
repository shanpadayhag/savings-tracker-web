"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import { Combobox, ComboboxItem, ComboboxItems } from '@/components/molecules/combobox';
import { db, GoalListItem, num, TransactionListItem, User } from '@/lib/utils';
import { IconDotsVertical, IconPlus, IconTrashFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from "sonner";

export default () => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [goalList, setGoalList] = useState<GoalListItem[]>([]);
  const [comboboxGoalItems, setComboboxGoalItems] = useState<ComboboxItems>([]);
  const [newGoalDialogIsOpen, setNewGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState("eur");
  const [newBalanceDialogIsOpen, setNewBalanceDialogIsOpen] = useState(false);
  const [newBalanceAmount, setNewBalanceAmount] = useState("");
  const [newTransactionDialogIsOpen, setNewTransactionDialogIsOpen] = useState(false);
  const [newTransactionActivity, setNewTransactionActivity] = useState("");
  const [newTransactionDescription, setNewTransactionDescription] = useState("");
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
    fetchGoalList();
  };

  const fetchGoalList = async () => {
    const goalListData = await db.goalList.toArray();
    setGoalList(goalListData);
    setComboboxGoalItems(goalListData.map(goal => ({
      label: goal.name,
      value: goal.id!.toString()
    })));
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
      remainingAmount: targetAmount,
      currency: newGoalCurrency,
      status: 'active',
      createdAt: today,
      updatedAt: today
    });

    fetchGoalList();
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
      date: today,
      type: "account_balance_adjustment",
      activity: "Added balance",
      description: "",
      accountBalanceAdjustment: {
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

  const handleAddGoalButtonOnClick = () => {
    setNewTransactionGoals(goals => {
      goals.push({ amount: "" });
      return [...goals];
    });
  };

  const handleGoalComboboxOnChange = (index: number) => (value: ComboboxItem) => {
    setNewTransactionGoals(goals => {
      goals[index].goal = value;
      return [...goals];
    });
  };

  const handleGoalAmountInputOnChangeValue = (value: string, index: number) => {
    setNewTransactionGoals(goals => {
      goals[index].amount = value;
      return [...goals];
    });
  };

  const handleCreateTransactionFormOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTransaction();
  };

  const handleCreateTransactionButtonOnClick = () => {
    createTransaction();
  };

  const createTransaction = async () => {
    const goals: TransactionListItem['goalAllocation'] = [];
    let totalAmount = 0;

    for (const goal of newTransactionGoals) {
      if (!goal.goal) continue;

      let goalID = parseInt(goal.goal.value);
      if (Number.isNaN(goalID)) continue;
      let amountAllocated = parseFloat(goal.amount);
      if (Number.isNaN(amountAllocated) || amountAllocated === 0) continue;

      goals.push({
        goal: {
          id: goalID,
          name: goal.goal.label,
        },
        amountAllocated: amountAllocated,
      });

      if (amountAllocated > 0) totalAmount += amountAllocated;
    };

    if (goals.length <= 0) return;

    const transaction: TransactionListItem = {
      type: "goal_allocation",
      activity: newTransactionActivity,
      description: newTransactionDescription,
      goalAllocation: goals,
    };

    const newAvailableFunds = userDetails!.financialSummary.totalAvailableFunds - totalAmount;
    if (newAvailableFunds < 0) return toast.error("Insufficient balance");
    userDetails!.financialSummary.totalAvailableFunds = newAvailableFunds;

    await db.transactionList.add(transaction);
    await db.user.update("singleton", userDetails!);

    for (const transact of (transaction.goalAllocation || [])) {
      const goal = await db.goalList.get(transact.goal.id);

      if (!goal) continue;

      await db.goalList.update(transact.goal.id, {
        currentAmount: goal.currentAmount + transact.amountAllocated,
        remainingAmount: goal.targetAmount - transact.amountAllocated,
      });
    }

    toast.success("Transaction added");
    fetchGoalList();
    setUserDetails({ ...userDetails! });
    setNewTransactionDialogIsOpen(false);
    setNewTransactionActivity("");
    setNewTransactionDescription("");
    setNewTransactionGoals([]);
  };

  useEffect(() => {
    handleOnPageLoad();
  }, []);

  return <>
    <div className="w-screen h-screen overflow-hidden bg-secondary">
      <div className="flex flex-col items-center overflow-auto h-full py-2">
        <div className="flex justify-end gap-2 p-4 w-full max-w-[500px]">
          <Button onClick={() => setNewBalanceDialogIsOpen(true)} variant="outline"><IconPlus /> Balance</Button>
          <Button onClick={() => setNewTransactionDialogIsOpen(true)} variant="outline"><IconPlus /> Transaction</Button>
          <Button onClick={() => setNewGoalDialogIsOpen(true)}><IconPlus /> Goal</Button>
        </div>

        <div className="flex flex-col gap-4 p-4 md:gap-6 w-full max-w-[500px]">
          {goalList.map(goal => <Card key={goal.id} className="flex-1">
            <CardHeader>
              <CardTitle className="self-center row-span-2">{goal.name}</CardTitle>
              <CardAction>
                <Button size="icon" variant="ghost">
                  <IconDotsVertical />
                </Button>
              </CardAction>
            </CardHeader>

            <CardContent>
              <h3 className="text-3xl font-semibold">{num.currencyFormat(goal.targetAmount, goal.currency)}</h3>
              <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="mt-3 mb-2" />
              <p className="flex justify-between">
                <span className="font-semibold">
                  {num.currencyFormat(goal.currentAmount, goal.currency)}
                  <span className="text-muted-foreground text-sm font-normal"> saved so far</span>
                </span>

                <span>{num.currencyFormat((goal.currentAmount / goal.targetAmount) * 100, goal.currency, false)}%</span>
              </p>
            </CardContent>

            <CardFooter className="mt-2">
              <p className="flex justify-between w-full">
                <span className="text-sm">Remaining</span>
                <span className="text-sm font-semibold">{num.currencyFormat(goal.remainingAmount, goal.currency)}</span>
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

      <Dialog open={newTransactionDialogIsOpen} onOpenChange={setNewTransactionDialogIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create transaction</DialogTitle>
            <DialogDescription>
              Enter your transaction details here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransactionFormOnSubmit} className="grid gap-4">
            <div className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground">Current Balance:</p>
              <h3 className="text-2xl font-semibold">{num.currencyFormat(userDetails?.financialSummary.totalAvailableFunds || 0, userDetails?.financialSummary.currency || "eur")}</h3>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="activity">Activity</Label>
              <Input onChange={event => setNewTransactionActivity(event.target.value)} id="activity" name="activity" placeholder="Enter activity" autoComplete="off" />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input onChange={event => setNewTransactionDescription(event.target.value)} id="description" name="description" placeholder="Enter description" autoComplete="off" />
            </div>

            <div><Button onClick={handleAddGoalButtonOnClick} type="button"><IconPlus /> Goal</Button></div>

            <div className="grid gap-3">
              {newTransactionGoals.map((goal, index) => <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    value={goal.goal}
                    onChangeValue={handleGoalComboboxOnChange(index)}
                    items={comboboxGoalItems} />
                </div>

                <Input onChange={event => handleGoalAmountInputOnChangeValue(event.target.value, index)} placeholder="Amount" className="w-25" autoComplete="off" />

                <Button size="icon">
                  <IconTrashFilled />
                </Button>
              </div>)}
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateTransactionButtonOnClick} type="submit">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
