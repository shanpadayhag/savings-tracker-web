"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import Combobox from '@/components/molecules/combobox';
import Currency, { currencyLabel } from '@/enums/currency';
import CategoryCombobox from '@/features/categories/components/category-combobox';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus, { goalStatusLabel } from '@/features/goals/enums/goal-status';
import useGoalsEvents from '@/features/goals/events/goals-events';
import useGoalsStates, { GoalStatusFilter } from '@/features/goals/states/goals-states';
import { cn } from '@/utils/cn';
import dateUtil from '@/utils/date-util';
import { balanceSizeClass } from '@/utils/balance-size';
import { IconCheck, IconDotsVertical, IconPlus, IconSearch } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect, useMemo } from 'react';

export default () => {
  const states = useGoalsStates();
  const events = useGoalsEvents(states);

  useEffect(() => {
    events.handleFetchGoals();
    events.handleFetchWalletOptions();
  }, []);

  const newGoalFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleCreateGoal();
  }, [events.handleCreateGoal]);

  const createButtonOnClick = useCallback(() => {
    events.handleCreateGoal();
  }, [events.handleCreateGoal]);

  const allocateMoneyOnClick = useCallback((goal: GoalListItem) => {
    states.setAllocationDialogIsOpen(true);
    states.setNewTransactionGoal(goal);
  }, []);

  const allocateOnClick = useCallback(() => {
    events.handleAllocateFundToGoal();
  }, [events.handleAllocateFundToGoal]);

  const allocateOnSubmit = useCallback((event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    events.handleAllocateFundToGoal();
  }, [events.handleAllocateFundToGoal]);

  const spendGoalFundButtonOnClick = useCallback((goal: GoalListItem) => {
    states.setNewTransactionGoal(goal);
    states.setSpendDialogIsOpen(true);
  }, []);

  const spendGoalFundFormOnSubmit = useCallback((event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    events.handleSpendFundsFromGoal();
  }, [events.handleSpendFundsFromGoal]);

  const spendGoalFundSubmitButtonOnClick = useCallback(() => {
    events.handleSpendFundsFromGoal();
  }, [events.handleSpendFundsFromGoal]);

  const completeGoalOnClick = useCallback((goal: GoalListItem) => {
    states.setNewTransactionGoal(goal);
    states.setCompleteDialogIsOpen(true);
  }, []);

  const completeGoalConfirmOnClick = useCallback(() => {
    events.handleCompleteGoal();
  }, [events.handleCompleteGoal]);

  const completeGoalFormOnSubmit = useCallback((event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    events.handleCompleteGoal();
  }, [events.handleCompleteGoal]);

  const archiveGoalOnClick = useCallback((goal: GoalListItem) => {
    states.setNewTransactionGoal(goal);
    states.setNewTransactionWallet(undefined);
    states.setArchiveDialogIsOpen(true);
  }, []);

  const transferMoneyOnClick = useCallback((goal: GoalListItem) => {
    states.setNewTransactionGoal(goal);
    states.setNewTransactionDestinationGoal(undefined);
    states.setTransferDialogIsOpen(true);
  }, []);

  const transferConfirmOnClick = useCallback(() => {
    events.handleTransferFundsBetweenGoals();
  }, [events.handleTransferFundsBetweenGoals]);

  const transferFormOnSubmit = useCallback((event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    events.handleTransferFundsBetweenGoals();
  }, [events.handleTransferFundsBetweenGoals]);

  const archiveGoalConfirmOnClick = useCallback(() => {
    events.handleArchiveGoal();
  }, [events.handleArchiveGoal]);

  const archiveGoalFormOnSubmit = useCallback((event: FormEvent<HTMLElement>) => {
    event.preventDefault();
    events.handleArchiveGoal();
  }, [events.handleArchiveGoal]);

  const archiveWalletOptions = states.walletOptions.filter(
    option => option.data?.currency === states.newTransactionGoal?.currency);

  const transferGoalOptions = states.goals
    .filter(goal => goal.status === GoalStatus.Active
      && goal.id !== states.newTransactionGoal?.id
      && goal.currency === states.newTransactionGoal?.currency)
    .map(goal => ({ value: goal.id, label: goal.name, data: goal }));
  const transferDestinationOption = states.newTransactionDestinationGoal
    ? {
      value: states.newTransactionDestinationGoal.id,
      label: states.newTransactionDestinationGoal.name,
      data: states.newTransactionDestinationGoal,
    }
    : undefined;

  const counts = useMemo(() => {
    const base: Record<GoalStatusFilter, number> = {
      all: states.goals.length,
      [GoalStatus.Active]: 0,
      [GoalStatus.Completed]: 0,
      [GoalStatus.Archived]: 0,
    };
    for (const goal of states.goals) base[goal.status] += 1;
    return base;
  }, [states.goals]);

  const filteredGoals = useMemo(() => {
    if (states.statusFilter === 'all') return states.goals;
    return states.goals.filter(goal => goal.status === states.statusFilter);
  }, [states.goals, states.statusFilter]);

  const headlineProgress = useMemo(() => {
    const active = states.goals.filter(goal => goal.status === GoalStatus.Active);
    if (active.length === 0) return null;
    const totalTarget = active.reduce((sum, goal) => sum + goal.targetAmount.value, 0);
    const totalSaved = active.reduce((sum, goal) => sum + goal.savedAmount.value, 0);
    if (totalTarget === 0) return null;
    return {
      activeCount: active.length,
      percent: Math.min(100, Math.round((totalSaved / totalTarget) * 100)),
    };
  }, [states.goals]);

  const filterOrder: GoalStatusFilter[] = [
    'all',
    GoalStatus.Active,
    GoalStatus.Completed,
    GoalStatus.Archived,
  ];
  const filterLabel: Record<GoalStatusFilter, string> = {
    all: 'All',
    [GoalStatus.Active]: goalStatusLabel[GoalStatus.Active],
    [GoalStatus.Completed]: goalStatusLabel[GoalStatus.Completed],
    [GoalStatus.Archived]: goalStatusLabel[GoalStatus.Archived],
  };

  return <>
    <div className="flex flex-col overflow-auto h-full pb-8 gap-6">
      <div className="w-full px-4 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Saving toward</p>
            <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Goals</h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Set targets, name what you're saving for, and watch the progress fill.
            </p>
          </div>

          {headlineProgress && (
            <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
              <p className="eyebrow">Across active goals</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="numeral-hero text-3xl font-semibold tabular-nums">
                  {headlineProgress.percent}%
                </span>
                <span className="text-xs text-muted-foreground">
                  toward {headlineProgress.activeCount}{' '}
                  {headlineProgress.activeCount === 1 ? 'goal' : 'goals'}
                </span>
              </div>
              <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${headlineProgress.percent}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input disabled className="pl-9" placeholder="Search goals (coming soon)" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterOrder.map(filter => {
              const isActive = states.statusFilter === filter;
              const count = counts[filter];
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => states.setStatusFilter(filter)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}>
                  <span>{filterLabel[filter]}</span>
                  <span className={cn('tabular-nums',
                    isActive ? 'text-background/70' : 'text-muted-foreground/60')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={() => states.setCreateGoalDialogIsOpen(true)}>
          <IconPlus className="size-4" /> New Goal
        </Button>
      </div>

      <div className="px-4">
        {filteredGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <p className="text-sm font-medium">
              {states.goals.length === 0
                ? 'No goals yet.'
                : `No ${filterLabel[states.statusFilter].toLowerCase()} goals.`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {states.goals.length === 0
                ? 'Name something specific you\'re saving for, then allocate money toward it.'
                : 'Switch the filter to see goals in other states.'}
            </p>
            {states.goals.length === 0 && (
              <Button className="mt-6" onClick={() => states.setCreateGoalDialogIsOpen(true)}>
                <IconPlus className="size-4" /> Create a goal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGoals.map(goal => {
              const pct = Math.min(100, Math.max(0, goal.savedPercent.value));
              const isActive = goal.status === GoalStatus.Active;
              const isComplete = goal.status === GoalStatus.Completed;
              const isArchived = goal.status === GoalStatus.Archived;
              return (
                <article key={goal.id}
                  className={cn('group relative flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm transition-shadow',
                    isActive && 'hover:shadow-md',
                    isArchived && 'opacity-70')}>
                  <header className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="heading-display truncate text-lg font-semibold tracking-tight">
                        {goal.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Target {goal.targetAmount.format()}
                      </p>
                    </div>
                    {isActive ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"
                            className="-mr-2 -mt-1 size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-muted">
                            <IconDotsVertical />
                            <span className="sr-only">Goal actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Transaction</DropdownMenuLabel>
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => allocateMoneyOnClick(goal)}>Allocate Money</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => transferMoneyOnClick(goal)}>Transfer Money</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => spendGoalFundButtonOnClick(goal)}>Spend Money</DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Goal</DropdownMenuLabel>
                          <DropdownMenuGroup>
                            <DropdownMenuItem disabled>Adjust Amount</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => completeGoalOnClick(goal)}>Complete Goal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveGoalOnClick(goal)}>
                              <span className="text-rose-700 dark:text-rose-400">Archive Goal</span>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        isComplete && 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
                        isArchived && 'bg-muted text-muted-foreground'
                      )}>
                        {isComplete && <IconCheck className="size-3" />}
                        {goalStatusLabel[goal.status]}
                      </span>
                    )}
                  </header>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className={cn(
                        'numeral-hero whitespace-nowrap font-semibold tabular-nums tracking-tight',
                        balanceSizeClass(goal.savedAmount.format())
                      )}>
                        {goal.savedAmount.format()}
                      </span>
                      <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                        / {goal.targetAmount.format()}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={cn(
                          'h-full rounded-full transition-[width] duration-500',
                          isComplete ? 'bg-amber-500' : 'bg-primary'
                        )}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="numeral-hero w-10 text-right text-xs font-semibold tabular-nums">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>

                  <footer className="flex items-end justify-between gap-3 border-t pt-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="numeral-hero mt-0.5 text-sm font-semibold tabular-nums">
                        {goal.remainingAmount.format()}
                      </p>
                    </div>
                    <p className="text-right text-muted-foreground">
                      {isActive
                        ? <>Updated {dateUtil.formatDisplayDate(goal.updatedAt)}</>
                        : <>{goalStatusLabel[goal.status]} {dateUtil.formatDisplayDate(goal.updatedAt)}</>}
                    </p>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
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

    <Dialog open={states.allocationDialogIsOpen} onOpenChange={states.setAllocationDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Goal</DialogTitle>
          <DialogDescription>Move money from your main Wallet to make progress on your goal.</DialogDescription>
        </DialogHeader>

        <form onSubmit={allocateOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Wallet</Label>
            <Combobox
              placeholder="Select wallet"
              searchPlaceholder="Search wallet name"
              emptyItemsPlaceholder="No wallets found."
              value={states.newTransactionWallet}
              onChangeValue={states.setNewTransactionWallet}
              options={states.walletOptions} />
            {states.newTransactionWallet?.data!.currentAmount
              && <span className="text-xs text-muted-foreground">Available: {states.newTransactionWallet.data!.currentAmount.format()}</span>}
          </div>

          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input onChange={event => states.setNewTransactionAmount(event.target.value)} placeholder="Goal's allocation amount" />
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input onChange={event => states.setNewTransactionNotes(event.target.value)} placeholder="Goal's allocation notes" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={allocateOnClick} type="button">Allocate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.completeDialogIsOpen} onOpenChange={states.setCompleteDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Goal</DialogTitle>
          <DialogDescription>Completing this goal records its saved balance as a spend and closes the goal. Use this when you've actually used the money for what you saved for.</DialogDescription>
        </DialogHeader>

        <form onSubmit={completeGoalFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Completing:</p>
            <p className="text-2xl font-semibold">{states.newTransactionGoal?.name}</p>
            {states.newTransactionGoal?.savedAmount
              && <span className="text-xs text-muted-foreground">Recording as spent: {states.newTransactionGoal.savedAmount.format()}</span>}
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={completeGoalConfirmOnClick} type="button">Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.archiveDialogIsOpen} onOpenChange={states.setArchiveDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Goal</DialogTitle>
          <DialogDescription>The goal's remaining balance will be returned to the wallet you choose. Only wallets with the same currency are listed.</DialogDescription>
        </DialogHeader>

        <form onSubmit={archiveGoalFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Returning to wallet:</p>
            <p className="text-2xl font-semibold">{states.newTransactionGoal?.savedAmount.format()}</p>
          </div>

          <div className="grid gap-2">
            <Label>Wallet</Label>
            <Combobox
              placeholder="Select wallet"
              searchPlaceholder="Search wallet name"
              emptyItemsPlaceholder="No matching-currency wallets found."
              value={states.newTransactionWallet}
              onChangeValue={states.setNewTransactionWallet}
              options={archiveWalletOptions} />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={archiveGoalConfirmOnClick} type="button">Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.transferDialogIsOpen} onOpenChange={states.setTransferDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>Move funds from this goal to another goal with the same currency.</DialogDescription>
        </DialogHeader>

        <form onSubmit={transferFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Transferring from:</p>
            <p className="text-2xl font-semibold">{states.newTransactionGoal?.name}</p>
            {states.newTransactionGoal?.savedAmount
              && <span className="text-xs text-muted-foreground">Available: {states.newTransactionGoal.savedAmount.format()}</span>}
          </div>

          <div className="grid gap-2">
            <Label>Destination Goal</Label>
            <Combobox
              placeholder="Select goal"
              searchPlaceholder="Search goal name"
              emptyItemsPlaceholder="No matching-currency goals found."
              value={transferDestinationOption}
              onChangeValue={option => states.setNewTransactionDestinationGoal(option.data)}
              options={transferGoalOptions} />
          </div>

          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input onChange={event => states.setNewTransactionAmount(event.target.value)} placeholder="Goal's transfer amount" />
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input onChange={event => states.setNewTransactionNotes(event.target.value)} placeholder="Goal's transfer notes" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={transferConfirmOnClick} type="button">Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.spendDialogIsOpen} onOpenChange={states.setSpendDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spend from Goal</DialogTitle>
          <DialogDescription>Deduct money from your selected goal to record a purchase.</DialogDescription>
        </DialogHeader>

        <form onSubmit={spendGoalFundFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Current Balance:</p>
            <p className="text-2xl font-semibold">{states.newTransactionGoal?.savedAmount.format()}</p>
          </div>

          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input onChange={event => states.setNewTransactionAmount(event.target.value)} placeholder="Goal's allocation amount" />
          </div>

          <div className="grid gap-2">
            <Label>Category <span className="text-xs text-muted-foreground">Defaults to "Others"</span></Label>
            <CategoryCombobox
              value={states.newTransactionCategory}
              onChange={states.setNewTransactionCategory} />
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input onChange={event => states.setNewTransactionNotes(event.target.value)} placeholder="Goal's allocation notes" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={spendGoalFundSubmitButtonOnClick} type="button">Allocate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
};
