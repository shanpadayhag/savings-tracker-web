"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/atoms/tooltip';
import getCachedGoals from '@/features/goals/api/get-cached-goals';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus from '@/features/goals/enums/goal-status';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType, { transactionTypeLabel } from '@/features/transactions/enums/transaction-type';
import useTransactionsEvents from '@/features/transactions/events/use-transactions-events';
import useTransactionsStates, { TransactionTypeFilter } from '@/features/transactions/states/use-transactions-states';
import { cn } from '@/utils/cn';
import dateUtil from '@/utils/date-util';
import {
  IconArrowBackUp,
  IconArrowDownLeft,
  IconArrowLeft,
  IconArrowNarrowRight,
  IconArrowRight,
  IconArrowsLeftRight,
  IconArrowUpRight,
  IconDotsVertical,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

type TypeStyle = {
  icon: ReactNode;
  /** Tailwind color set for the type chip + leading icon disc. */
  chipClass: string;
  iconWrapClass: string;
  /** Direction sentiment for the amount column. */
  sentiment: 'positive' | 'negative' | 'neutral';
};

const typeStyles: Record<TransactionType, TypeStyle> = {
  [TransactionType.Allocate]: {
    icon: <IconArrowDownLeft className="size-3.5" />,
    chipClass: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    iconWrapClass: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    sentiment: 'positive',
  },
  [TransactionType.Spend]: {
    icon: <IconArrowUpRight className="size-3.5" />,
    chipClass: 'bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    iconWrapClass: 'bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    sentiment: 'negative',
  },
  [TransactionType.Transfer]: {
    icon: <IconArrowsLeftRight className="size-3.5" />,
    chipClass: 'bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400',
    iconWrapClass: 'bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400',
    sentiment: 'neutral',
  },
  [TransactionType.Deallocate]: {
    icon: <IconArrowBackUp className="size-3.5" />,
    chipClass: 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    iconWrapClass: 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    sentiment: 'neutral',
  },
  [TransactionType.Convert]: {
    icon: <IconRefresh className="size-3.5" />,
    chipClass: 'bg-sky-600/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-400',
    iconWrapClass: 'bg-sky-600/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-400',
    sentiment: 'neutral',
  },
};

const filterOrder: TransactionTypeFilter[] = [
  'all',
  TransactionType.Allocate,
  TransactionType.Spend,
  TransactionType.Transfer,
  TransactionType.Deallocate,
  TransactionType.Convert,
];

const filterLabel: Record<TransactionTypeFilter, string> = {
  all: 'All',
  [TransactionType.Allocate]: transactionTypeLabel[TransactionType.Allocate],
  [TransactionType.Spend]: transactionTypeLabel[TransactionType.Spend],
  [TransactionType.Transfer]: transactionTypeLabel[TransactionType.Transfer],
  [TransactionType.Deallocate]: transactionTypeLabel[TransactionType.Deallocate],
  [TransactionType.Convert]: transactionTypeLabel[TransactionType.Convert],
};

const Empty = () => <span className="text-muted-foreground/40">&mdash;</span>;

const CANCELLABLE_TYPES: ReadonlySet<TransactionType> = new Set([
  TransactionType.Spend,
  TransactionType.Transfer,
  TransactionType.Convert,
]);

type CancelRowState =
  | { kind: 'hidden'; }
  | { kind: 'eligible'; }
  | { kind: 'blocked'; status: GoalStatus.Completed | GoalStatus.Archived; goalName: string; }
  | { kind: 'soft-cancelled'; cancelledAt: Date; }
  | { kind: 'reversed'; reversedAt: Date; }
  | { kind: 'reversal'; };

const classifyCancelState = (
  transaction: TransactionListItem,
  goalsByID: Map<string, GoalListItem>,
): CancelRowState => {
  if (transaction.cancelledAt) return { kind: 'soft-cancelled', cancelledAt: transaction.cancelledAt };
  if (transaction.reversedAt) return { kind: 'reversed', reversedAt: transaction.reversedAt };
  if (transaction.reversalOfID) return { kind: 'reversal' };
  if (!CANCELLABLE_TYPES.has(transaction.type)) return { kind: 'hidden' };

  for (const goalID of transaction.goalSourceIDs ?? []) {
    const goal = goalsByID.get(goalID);
    if (!goal) continue;
    if (goal.status === GoalStatus.Completed || goal.status === GoalStatus.Archived) {
      return { kind: 'blocked', status: goal.status, goalName: goal.name };
    }
  }
  return { kind: 'eligible' };
};

export default () => {
  const states = useTransactionsStates();
  const events = useTransactionsEvents(states);
  const [goalsByID, setGoalsByID] = useState<Map<string, GoalListItem>>(new Map());

  useEffect(() => {
    events.handleFetchTransactions();
    getCachedGoals()
      .then(goals => setGoalsByID(new Map(goals.map(goal => [goal.id, goal]))))
      .catch(() => setGoalsByID(new Map()));
  }, []);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const handlePaginationShortcut = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        events.handleFetchPreviousPage();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        events.handleFetchNextPage();
      }
    };

    window.addEventListener('keydown', handlePaginationShortcut);
    return () => window.removeEventListener('keydown', handlePaginationShortcut);
  }, [events.handleFetchPreviousPage, events.handleFetchNextPage]);

  const counts = useMemo(() => {
    const base: Record<TransactionTypeFilter, number> = {
      all: states.transactions.length,
      [TransactionType.Allocate]: 0,
      [TransactionType.Spend]: 0,
      [TransactionType.Transfer]: 0,
      [TransactionType.Deallocate]: 0,
      [TransactionType.Convert]: 0,
    };
    for (const transaction of states.transactions) base[transaction.type] += 1;
    return base;
  }, [states.transactions]);

  const cancelledCount = useMemo(
    () => states.transactions.filter(t => t.cancelledAt).length,
    [states.transactions],
  );

  const filtered = useMemo(() => {
    let next = states.typeFilter === 'all'
      ? states.transactions
      : states.transactions.filter(t => t.type === states.typeFilter);
    if (states.hideCancelled) next = next.filter(t => !t.cancelledAt);
    return next;
  }, [states.transactions, states.typeFilter, states.hideCancelled]);

  return <div className="flex flex-col overflow-auto h-full pb-6 gap-6">
    <div className="w-full px-4 pt-6">
      <p className="eyebrow">Activity</p>
      <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Transactions</h1>
      <p className="mt-2 text-sm text-muted-foreground">A detailed log of all your financial activities. Search and filter to find what you need.</p>
    </div>

    <div className="px-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input disabled className="pl-9" placeholder="Search transactions (coming soon)" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {filterOrder.map(filter => {
          const isActive = states.typeFilter === filter;
          const count = counts[filter];
          return (
            <button
              key={filter}
              type="button"
              onClick={() => states.setTypeFilter(filter)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              <span>{filterLabel[filter]}</span>
              <span className={cn(
                'tabular-nums',
                isActive ? 'text-background/70' : 'text-muted-foreground/60'
              )}>
                {count}
              </span>
            </button>
          );
        })}
        {cancelledCount > 0 && (
          <>
            <span className="mx-1 h-3 w-px self-center bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={() => states.setHideCancelled(!states.hideCancelled)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                states.hideCancelled
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              <span>{states.hideCancelled ? 'Cancelled hidden' : 'Cancelled'}</span>
              {!states.hideCancelled && (
                <span className="tabular-nums text-muted-foreground/60">{cancelledCount}</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>

    <div className="px-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="numeral-hero text-base font-semibold tabular-nums">{filtered.length}</span>
            <span className="text-xs text-muted-foreground">
              {filtered.length === 1 ? 'transaction' : 'transactions'}
              {states.typeFilter !== 'all' && <> &middot; {filterLabel[states.typeFilter]}</>}
            </span>
          </div>
        </div>

        <Table className="min-w-[640px]">
          <TableHeader className="bg-muted/40 sticky top-0 z-0">
            <TableRow>
              <TableHead className="w-[140px] pl-5">Type</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden xl:table-cell">Notes</TableHead>
              <TableHead className="w-2 pr-5"><span className="sr-only">End</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <p className="text-sm font-medium">
                      {states.transactions.length === 0
                        ? 'No transactions yet.'
                        : `No ${filterLabel[states.typeFilter].toLowerCase()} transactions.`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {states.transactions.length === 0
                        ? 'Allocate funds to a goal or record a spend to see activity here.'
                        : 'Switch the filter to see other movements.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map(transaction => {
              const style = typeStyles[transaction.type];
              const date = transaction.createdAt;
              const dayLabel = date ? dateUtil.formatDisplayDate(date) : null;
              const isConvert = transaction.type === TransactionType.Convert
                && transaction.amount.length > 1;
              const primaryAmount = transaction.amount[0];
              const cancelState = classifyCancelState(transaction, goalsByID);
              const isSoftCancelled = cancelState.kind === 'soft-cancelled';
              const isReversal = cancelState.kind === 'reversal';

              // Reversal entries flip the original transaction's sentiment —
              // a reversed Spend (negative) becomes a positive return; a
              // reversed Allocate (positive) becomes a negative outflow.
              const effectiveSentiment = isReversal
                ? (style.sentiment === 'positive' ? 'negative'
                  : style.sentiment === 'negative' ? 'positive'
                  : 'neutral')
                : style.sentiment;
              const sign = isSoftCancelled
                ? ''
                : effectiveSentiment === 'positive' ? '+'
                : effectiveSentiment === 'negative' ? '−'
                : '';
              const amountClass = isSoftCancelled
                ? 'text-muted-foreground'
                : effectiveSentiment === 'positive'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : effectiveSentiment === 'negative'
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-foreground';

              const transactionCode = transaction.id ? transaction.id.slice(0, 8).toUpperCase() : null;
              const reversalRefCode = transaction.reversalOfID
                ? transaction.reversalOfID.slice(0, 8).toUpperCase()
                : null;

              const showMenu = cancelState.kind === 'eligible' || cancelState.kind === 'blocked';

              return (
                <TableRow key={transaction.id} className="group">
                  <TableCell className="py-4 pl-5">
                    <div className="inline-flex items-center gap-2">
                      <span className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full',
                        style.iconWrapClass)}>
                        {style.icon}
                      </span>
                      <div className="flex flex-col leading-tight">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium self-start',
                          style.chipClass)}>
                          {transactionTypeLabel[transaction.type]}
                        </span>
                        {cancelState.kind === 'soft-cancelled' ? (
                          <span className="mt-1 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Cancelled · {dateUtil.formatDisplayDate(cancelState.cancelledAt)}
                          </span>
                        ) : cancelState.kind === 'reversed' ? (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <IconArrowBackUp className="size-3" />
                            Reversed · {dateUtil.formatDisplayDate(cancelState.reversedAt)}
                          </span>
                        ) : cancelState.kind === 'reversal' && reversalRefCode ? (
                          <span className="mt-1 inline-flex items-center gap-1 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            <IconArrowBackUp className="size-3" />
                            Reversal of #{reversalRefCode}
                          </span>
                        ) : transactionCode ? (
                          <span className="mt-1 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            #{transactionCode}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium tabular-nums">
                        {dayLabel ?? <Empty />}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {isReversal ? <>
                        <span className="text-foreground">{transaction.to || <Empty />}</span>
                        {(transaction.from || transaction.to) && (
                          <IconArrowNarrowRight className="size-4 text-muted-foreground/60" />
                        )}
                        <span className="text-foreground">{transaction.from || <Empty />}</span>
                      </> : <>
                        <span className="text-foreground">{transaction.from || <Empty />}</span>
                        {(transaction.from || transaction.to) && (
                          <IconArrowNarrowRight className="size-4 text-muted-foreground/60" />
                        )}
                        <span className="text-foreground">{transaction.to || <Empty />}</span>
                      </>}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {transaction.category
                      ? <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs">
                        <span className="size-2 rounded-full" style={{ backgroundColor: transaction.category.color }} aria-hidden="true" />
                        {transaction.category.name}
                      </span>
                      : <Empty />}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className={cn(
                      'numeral-hero text-sm font-semibold tabular-nums',
                      amountClass,
                      isSoftCancelled && 'line-through decoration-muted-foreground/60 decoration-[1.5px]',
                    )}>
                      {isConvert
                        ? <span className="inline-flex items-center gap-1.5">
                          <span>{primaryAmount.format()}</span>
                          <IconArrowNarrowRight className="size-3.5 text-muted-foreground" />
                          <span>{transaction.amount[1].format()}</span>
                        </span>
                        : <span>{sign}{primaryAmount.format()}</span>}
                    </div>
                    {transaction.fee && (
                      <div className={cn(
                        'mt-0.5 text-[11px] tabular-nums text-muted-foreground',
                        isSoftCancelled && 'line-through decoration-muted-foreground/60',
                      )}>
                        fee {transaction.fee.format()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden py-4 text-sm text-muted-foreground xl:table-cell">
                    {transaction.notes
                      ? <span className="line-clamp-1 max-w-[28ch]">{transaction.notes}</span>
                      : <Empty />}
                  </TableCell>
                  <TableCell className="py-4 pr-5">
                    {showMenu && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"
                            className="size-7 text-muted-foreground transition-opacity sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-muted">
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">Transaction actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {cancelState.kind === 'eligible' ? (
                            <DropdownMenuItem onClick={() => {
                              states.setCancelTargetID(transaction.id);
                              states.setCancelDialogIsOpen(true);
                            }}>
                              Cancel transaction
                            </DropdownMenuItem>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <DropdownMenuItem disabled
                                      onSelect={event => event.preventDefault()}>
                                      Cancel transaction
                                    </DropdownMenuItem>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[220px]">
                                  This transaction belongs to <span className="font-medium">{cancelState.kind === 'blocked' ? cancelState.goalName : ''}</span>, which is {cancelState.kind === 'blocked' && cancelState.status === GoalStatus.Completed ? 'completed' : 'archived'}.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {states.isPageLoading ? 'Loading…' : 'Use ← / → to navigate'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!states.prevCursor || states.isPageLoading}
              onClick={events.handleFetchPreviousPage}>
              <IconArrowLeft className="size-4" />
              Previous
              <kbd className="ml-1 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">←</kbd>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!states.nextCursor || states.isPageLoading}
              onClick={events.handleFetchNextPage}>
              Next
              <kbd className="ml-1 hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">→</kbd>
              <IconArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog open={states.cancelDialogIsOpen} onOpenChange={open => {
      states.setCancelDialogIsOpen(open);
      if (!open) states.setCancelTargetID(null);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel transaction</DialogTitle>
          <DialogDescription>
            {(() => {
              if (!states.cancelTargetID) return null;
              const target = states.transactions.find(t => t.id === states.cancelTargetID);
              if (!target?.createdAt) return "This will reverse the transaction's effect on your balances.";
              const sameDay = (() => {
                const a = target.createdAt;
                const b = new Date();
                return a.getFullYear() === b.getFullYear()
                  && a.getMonth() === b.getMonth()
                  && a.getDate() === b.getDate();
              })();
              return sameDay
                ? "This transaction was made today and will be removed from your totals. The row stays in your history with a Cancelled marker."
                : "This transaction is from an earlier day. A reversal entry will be added on today's date so your past charts stay truthful. The original row stays untouched.";
            })()}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Keep it</Button></DialogClose>
          <Button type="button" onClick={async () => {
            if (!states.cancelTargetID) return;
            const id = states.cancelTargetID;
            states.setCancelDialogIsOpen(false);
            states.setCancelTargetID(null);
            await events.handleConfirmCancelTransaction(id);
          }}>Cancel transaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
};
