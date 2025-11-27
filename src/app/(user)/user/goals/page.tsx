"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { Combobox } from '@/components/molecules/combobox';
import Currency, { currencyLabel } from '@/enums/currency';
import useGoalsEvents from '@/features/goals/events/goals-events';
import useGoalsStates from '@/features/goals/states/goals-states';
import currencyUtil from '@/utils/currency-util';
import { IconDotsVertical } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect } from 'react';

export default () => {
  const states = useGoalsStates();
  const events = useGoalsEvents(states);

  useEffect(() => {
    events.handleFetchGoals();
  }, []);

  const newGoalFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleCreateGoal();
  }, [events.handleCreateGoal]);

  const createButtonOnClick = useCallback(() => {
    events.handleCreateGoal();
  }, [events.handleCreateGoal]);

  const allocateMoneyOnClick = useCallback(() => {
  }, []);

  const spendMoneyOnClick = useCallback(() => {
  }, []);

  const completeGoalOnClick = useCallback(() => {
  }, []);

  const archiveGoalOnClick = useCallback(() => {
  }, []);

  return <>
    <div className="flex flex-col overflow-auto h-full pb-2 gap-6">
      <div className="w-full px-4 pt-4">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Goals</h1>
        <p className="text-sm text-muted-foreground font-light">Set and track savings targets to achieve your financial objectives.</p>
      </div>

      <div className="flex justify-between items-center px-4">
        <div><Input disabled className="w-70" placeholder="Search for goal" /></div>
        <div><Button onClick={() => states.setCreateGoalDialogIsOpen(true)}>New Goal</Button></div>
      </div>

      <div className="border-y">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-0">
            <TableRow>
              <TableHead><span className="sr-only">Drag</span></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Target Amount</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Saved Amount</TableHead>
              <TableHead>Remaining Amount</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {states.goals.length > 0
              ? <>{states.goals.map(goal => <TableRow key={goal.id}>
                <TableCell></TableCell>
                <TableCell className="py-4">{goal.name}</TableCell>
                <TableCell className="py-4">{goal.targetAmount.format()}</TableCell>
                <TableCell className="py-4"><span className="flex items-center gap-2">
                  <Progress value={goal.savedPercent.value} className="w-30" />
                  {goal.savedPercent.format()}
                </span></TableCell>
                <TableCell className="py-4">{goal.savedAmount.format()}</TableCell>
                <TableCell className="py-4">{goal.remainingAmount.format()}</TableCell>
                <TableCell className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
                        variant="ghost" size="icon">
                        <IconDotsVertical />
                        <span className="sr-only">Goal Item Action</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-38">
                      <DropdownMenuLabel>Transaction</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => states.setAllocationDialogIsOpen(true)}>Allocate Money</DropdownMenuItem>
                        <DropdownMenuItem disabled onClick={spendMoneyOnClick}>Spend Money</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Goal</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem disabled>Adjust Amount</DropdownMenuItem>
                        <DropdownMenuItem disabled onClick={completeGoalOnClick}>Complete Goal</DropdownMenuItem>
                        <DropdownMenuItem disabled onClick={archiveGoalOnClick}><span className="text-red-700">Archive Goal</span></DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>)}</>
              : <TableRow>
                <TableCell className="h-24 text-center" colSpan={7}>
                  No goals.
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>

    <Dialog open={states.createGoalDialogIsOpen} onOpenChange={states.setCreateGoalDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Goal</DialogTitle>
          <DialogDescription>Goals help you focus your savings. Give your goal a name and a target amount to track your progress.</DialogDescription>
        </DialogHeader>

        <form onSubmit={newGoalFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input onChange={event => states.setNewGoalName(event.target.value)} placeholder="Goal's name" />
          </div>

          <div className="grid gap-2">
            <Label>Target Amount</Label>
            <Input onChange={event => states.setNewGoalTargetAmount(event.target.value)} placeholder="Goal's target amount" />
          </div>

          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select value={states.newGoalCurrency} onValueChange={(currency: Currency) => states.setNewGoalCurrency(currency)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Currency</SelectLabel>
                  {(Object.keys(Currency) as Array<keyof typeof Currency>).map(key => (
                    <SelectItem key={key} value={Currency[key]}>
                      {currencyLabel[Currency[key]]}
                    </SelectItem>))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={createButtonOnClick} type="button">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* <Dialog open={states.allocationDialogIsOpen} onOpenChange={states.setAllocationDialogIsOpen}> */}
    <Dialog open onOpenChange={states.setAllocationDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Goal</DialogTitle>
          <DialogDescription>Move money from your main Wallet to make progress on your goal.</DialogDescription>
        </DialogHeader>

        <form onSubmit={newGoalFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Wallet</Label>
            <Combobox placeholder="Select wallet" />
            <span className="text-xs text-muted-foreground">Available: $1,250.50</span>
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input onChange={event => states.setNewGoalTargetAmount(event.target.value)} placeholder="Goal's allocation notes" />
          </div>

          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input onChange={event => states.setNewGoalTargetAmount(event.target.value)} placeholder="Goal's allocation amount" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={createButtonOnClick} type="button">Allocate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
};
