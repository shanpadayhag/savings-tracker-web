"use client";

import { Button } from '@/components/atoms/button';
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/atoms/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/popover';
import { Progress } from '@/components/atoms/progress';
import { cn, db, GoalListItem, num } from '@/lib/utils';
import { IconCheck, IconChevronDown, IconDotsVertical, IconPlus, IconTrashFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default () => {
  const [goalList, setGoalList] = useState<GoalListItem[]>([]);
  const [newGoalDialogIsOpen, setNewGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState("eur");
  const [newTransactionDialogIsOpen, setNewTransactionDialogIsOpen] = useState(false);

  const handleNewGoalFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createGoal();
  };

  const handleNewGoalButtonOnClick = () => {
    createGoal();
  };

  const handleOnPageLoad = async () => {
    const goals = await db.goalList.toArray();
    setGoalList(goals);
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
  };

  useEffect(() => {
    handleOnPageLoad();
  }, []);

  return <>
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center bg-secondary">
      <div className="flex justify-end gap-4 p-4 md:gap-6 w-full max-w-[500px]">
        <Button onClick={() => setNewTransactionDialogIsOpen(true)} variant="outline"><IconPlus /> Transaction</Button>
        <Button onClick={() => setNewGoalDialogIsOpen(true)}><IconPlus /> Goal</Button>
      </div>

      <div className="flex flex-col gap-4 p-4 md:gap-6 w-full max-w-[500px]">
        {goalList.map(goal => <Card key={goal.id} className="flex-1">
          <CardHeader>
            <CardTitle className="self-center row-span-2">
              {goal.name}
              <span className="font-normal text-sm text-muted-foreground"> ({goal.status})</span>
            </CardTitle>
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

        <form onSubmit={handleNewGoalFormSubmit} className="grid gap-4">
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
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleNewGoalButtonOnClick} type="submit">Save</Button>
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

        <form className="grid gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Current Balance:</p>
            <h3 className="text-2xl font-semibold">1324.25</h3>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="activity">Activity</Label>
            <Input id="activity" name="activity" placeholder="Enter activity" />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Enter description" />
          </div>

          <div><Button><IconPlus /> Goal</Button></div>

          <div className="grid gap-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={true}
                      // same value as open in popover
                      className="w-full justify-between">
                      Select goal
                      <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search framework..." />
                      <CommandList>
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value={"value"}
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 h-4 w-4",
                                // value === framework.value ? "opacity-100" : "opacity-0"
                                "opacity-0"
                              )}
                            />
                            Groceries
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Input placeholder="Amount" className="w-25" />

              <Button size="icon">
                <IconTrashFilled />
              </Button>
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save</Button>
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
