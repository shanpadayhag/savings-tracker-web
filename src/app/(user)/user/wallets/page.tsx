"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import Combobox from '@/components/molecules/combobox';
import Currency, { currencyLabel } from '@/enums/currency';
import useWalletsEvents from '@/features/wallets/events/wallets-events';
import useWalletsStates, { WalletCurrencyFilter } from '@/features/wallets/states/wallets-states';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';
import { balanceSizeClass } from '@/utils/balance-size';
import { IconDotsVertical, IconPlus, IconSearch, IconWallet } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect, useMemo } from 'react';

export default () => {
  const states = useWalletsStates();
  const events = useWalletsEvents(states);

  const newWalletFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleCreateWallet();
  }, [events.handleCreateWallet]);

  const createButtonOnClick = useCallback(() => {
    events.handleCreateWallet();
  }, [events.handleCreateWallet]);

  const allocateFundToWalletFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleAllocateFundsToWallet();
  }, [events.handleAllocateFundsToWallet]);

  const allocateButtonOnClick = useCallback(() => {
    events.handleAllocateFundsToWallet();
  }, [events.handleAllocateFundsToWallet]);

  const convertButtonOnClick = useCallback(() => {
    events.handleConvertFundsBetweenWallets();
  }, [events.handleConvertFundsBetweenWallets]);

  const convertFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleConvertFundsBetweenWallets();
  }, [events.handleConvertFundsBetweenWallets]);

  const transferButtonOnClick = useCallback(() => {
    events.handleTransferFundsBetweenWallets();
  }, [events.handleTransferFundsBetweenWallets]);

  const transferFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleTransferFundsBetweenWallets();
  }, [events.handleTransferFundsBetweenWallets]);

  const convertDestinationOption = states.convertDestinationWallet
    ? {
      value: states.convertDestinationWallet.id,
      label: states.convertDestinationWallet.name,
      data: states.convertDestinationWallet,
    }
    : undefined;
  const convertDestinationOptions = states.wallets
    .filter(wallet => wallet.id !== states.selectedWallet?.id)
    .map(wallet => ({ value: wallet.id, label: wallet.name, data: wallet }));

  const transferDestinationOption = states.transferDestinationWallet
    ? {
      value: states.transferDestinationWallet.id,
      label: states.transferDestinationWallet.name,
      data: states.transferDestinationWallet,
    }
    : undefined;
  const transferDestinationOptions = states.wallets
    .filter(wallet => wallet.id !== states.selectedWallet?.id
      && wallet.currency === states.selectedWallet?.currency)
    .map(wallet => ({ value: wallet.id, label: wallet.name, data: wallet }));

  useEffect(() => {
    events.handleFetchWallets();
  }, []);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<Currency, number>();
    for (const wallet of states.wallets) {
      const previous = totals.get(wallet.currency) ?? 0;
      totals.set(wallet.currency, currencyUtil.parse(previous, wallet.currency)
        .add(wallet.currentAmount.value).value);
    }
    return totals;
  }, [states.wallets]);

  const counts = useMemo(() => {
    const base: Record<WalletCurrencyFilter, number> = {
      all: states.wallets.length,
      [Currency.Euro]: 0,
      [Currency.CAD]: 0,
      [Currency.USD]: 0,
      [Currency.Peso]: 0,
    };
    for (const wallet of states.wallets) base[wallet.currency] += 1;
    return base;
  }, [states.wallets]);

  const currencyFilterOptions = useMemo<WalletCurrencyFilter[]>(() => {
    const present = Array.from(new Set(states.wallets.map(wallet => wallet.currency)));
    return ['all', ...present];
  }, [states.wallets]);

  const filteredWallets = useMemo(() => {
    if (states.currencyFilter === 'all') return states.wallets;
    return states.wallets.filter(wallet => wallet.currency === states.currencyFilter);
  }, [states.wallets, states.currencyFilter]);

  const filterLabel = (filter: WalletCurrencyFilter) =>
    filter === 'all' ? 'All' : currencyLabel[filter];

  return <>
    <div className="flex flex-col overflow-auto h-full pb-8 gap-6">
      <div className="w-full px-4 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Cash on hand</p>
            <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Wallets</h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Track real account balances. Allocate from here to fund your goals.
            </p>
          </div>

          {totalsByCurrency.size > 0 && (
            <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
              <p className="eyebrow">Total balance</p>
              <div className="mt-2 flex flex-col gap-1">
                {Array.from(totalsByCurrency.entries()).map(([currency, total]) => (
                  <div key={currency} className="flex items-baseline justify-between gap-6">
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {currencyLabel[currency]}
                    </span>
                    <span className="numeral-hero text-base font-semibold tabular-nums">
                      {currencyUtil.format(total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input disabled className="pl-9" placeholder="Search wallets (coming soon)" />
          </div>
          {currencyFilterOptions.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {currencyFilterOptions.map(filter => {
                const isActive = states.currencyFilter === filter;
                const count = counts[filter];
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => states.setCurrencyFilter(filter)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}>
                    <span>{filterLabel(filter)}</span>
                    <span className={cn('tabular-nums',
                      isActive ? 'text-background/70' : 'text-muted-foreground/60')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button onClick={() => states.setCreateWalletDialogIsOpen(true)}>
          <IconPlus className="size-4" /> New Wallet
        </Button>
      </div>

      <div className="px-4">
        {filteredWallets.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <IconWallet className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">
              {states.wallets.length === 0
                ? 'No wallets yet.'
                : `No ${filterLabel(states.currencyFilter).toLowerCase()} wallets.`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {states.wallets.length === 0
                ? 'Add a wallet for each real account you want to track. Money flows from wallets into goals.'
                : 'Switch the filter to see wallets in another currency.'}
            </p>
            {states.wallets.length === 0 && (
              <Button className="mt-6" onClick={() => states.setCreateWalletDialogIsOpen(true)}>
                <IconPlus className="size-4" /> Create a wallet
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWallets.map(wallet => (
              <article key={wallet.id}
                className="group relative flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="heading-display truncate text-lg font-semibold tracking-tight">
                      {wallet.name}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {currencyLabel[wallet.currency]}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className="-mr-2 -mt-1 size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-muted">
                        <IconDotsVertical />
                        <span className="sr-only">Wallet actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Transaction</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => {
                          states.setSelectedWallet(wallet);
                          states.setAllocateDialogIsOpen(true);
                        }}>Allocate Money</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          states.setSelectedWallet(wallet);
                          states.setConvertDestinationWallet(undefined);
                          states.setConvertAmountSent("");
                          states.setConvertFee("");
                          states.setConvertAmountReceived("");
                          states.setConvertNotes("");
                          states.setConvertDialogIsOpen(true);
                        }}>Convert Money</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          states.setSelectedWallet(wallet);
                          states.setTransferDestinationWallet(undefined);
                          states.setTransferAmount("");
                          states.setTransferFee("");
                          states.setTransferNotes("");
                          states.setTransferDialogIsOpen(true);
                        }}>Bank Transfer</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem disabled>
                          <span className="text-rose-700 dark:text-rose-400">Archive Wallet</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                <div>
                  <p className="eyebrow">Current balance</p>
                  <p className={cn(
                    'numeral-hero mt-1 whitespace-nowrap font-semibold tabular-nums tracking-tight',
                    balanceSizeClass(wallet.currentAmount.format())
                  )}>
                    {wallet.currentAmount.format()}
                  </p>
                </div>

                <footer className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                  <span>Created {dateUtil.formatDisplayDate(wallet.createdAt)}</span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>

    <Dialog open={states.createWalletDialogIsOpen} onOpenChange={states.setCreateWalletDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Wallet</DialogTitle>
          <DialogDescription>Create a new wallet to track real account balances and prepare funds for your savings goals.</DialogDescription>
        </DialogHeader>

        <form onSubmit={newWalletFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input onChange={event => states.setNewWalletName(event.target.value)} placeholder="Wallet's name" />
          </div>

          <div className="grid gap-2">
            <Label>Currency</Label>
            <Select value={states.newWalletCurrency} onValueChange={(currency: Currency) => states.setNewWalletCurrency(currency)}>
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

    <Dialog open={states.convertDialogIsOpen} onOpenChange={states.setConvertDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Money</DialogTitle>
          <DialogDescription>Move funds between wallets, accounting for the fee charged and the amount that lands in the destination currency.</DialogDescription>
        </DialogHeader>

        <form onSubmit={convertFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Converting from:</p>
            <p className="text-2xl font-semibold">{states.selectedWallet?.name}</p>
            {states.selectedWallet?.currentAmount
              && <span className="text-xs text-muted-foreground">Available: {states.selectedWallet.currentAmount.format()}</span>}
          </div>

          <div className="grid gap-2">
            <Label>Destination Wallet</Label>
            <Combobox
              placeholder="Select wallet"
              searchPlaceholder="Search wallet name"
              emptyItemsPlaceholder="No wallets found."
              value={convertDestinationOption}
              onChangeValue={option => states.setConvertDestinationWallet(option.data)}
              options={convertDestinationOptions} />
            {states.convertDestinationWallet
              && <span className="text-xs text-muted-foreground">Currency: {currencyLabel[states.convertDestinationWallet.currency]}</span>}
          </div>

          <div className="grid gap-2">
            <Label>Amount Transferred {states.selectedWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.selectedWallet.currency]}</span>}</Label>
            <Input value={states.convertAmountSent} onChange={event => states.setConvertAmountSent(event.target.value)} placeholder="Amount being sent" />
          </div>

          <div className="grid gap-2">
            <Label>Fee {states.selectedWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.selectedWallet.currency]}</span>}</Label>
            <Input value={states.convertFee} onChange={event => states.setConvertFee(event.target.value)} placeholder="Conversion fee" />
          </div>

          <div className="grid gap-2">
            <Label>Amount Received {states.convertDestinationWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.convertDestinationWallet.currency]}</span>}</Label>
            <Input value={states.convertAmountReceived} onChange={event => states.setConvertAmountReceived(event.target.value)} placeholder="Amount landing in destination wallet" />
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input value={states.convertNotes} onChange={event => states.setConvertNotes(event.target.value)} placeholder="Conversion notes" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={convertButtonOnClick} type="button">Convert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.transferDialogIsOpen} onOpenChange={states.setTransferDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bank Transfer</DialogTitle>
          <DialogDescription>Move funds between wallets in the same currency. The amount stays the same — only the fee is deducted from the source.</DialogDescription>
        </DialogHeader>

        <form onSubmit={transferFormOnSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            <p className="text-xs text-muted-foreground">Transferring from:</p>
            <p className="text-2xl font-semibold">{states.selectedWallet?.name}</p>
            {states.selectedWallet?.currentAmount
              && <span className="text-xs text-muted-foreground">Available: {states.selectedWallet.currentAmount.format()}</span>}
          </div>

          <div className="grid gap-2">
            <Label>Destination Wallet {states.selectedWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.selectedWallet.currency]}</span>}</Label>
            <Combobox
              placeholder="Select wallet"
              searchPlaceholder="Search wallet name"
              emptyItemsPlaceholder="No wallets in this currency."
              value={transferDestinationOption}
              onChangeValue={option => states.setTransferDestinationWallet(option.data)}
              options={transferDestinationOptions} />
          </div>

          <div className="grid gap-2">
            <Label>Amount {states.selectedWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.selectedWallet.currency]}</span>}</Label>
            <Input value={states.transferAmount} onChange={event => states.setTransferAmount(event.target.value)} placeholder="Amount being transferred" />
          </div>

          <div className="grid gap-2">
            <Label>Fee {states.selectedWallet && <span className="text-xs text-muted-foreground">in {currencyLabel[states.selectedWallet.currency]}</span>}</Label>
            <Input value={states.transferFee} onChange={event => states.setTransferFee(event.target.value)} placeholder="Transfer fee" />
          </div>

          <div className="grid gap-2">
            <Label>Notes <span className="text-xs text-muted-foreground">Optional</span></Label>
            <Input value={states.transferNotes} onChange={event => states.setTransferNotes(event.target.value)} placeholder="Transfer notes" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={transferButtonOnClick} type="button">Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={states.allocateDialogIsOpen} onOpenChange={states.setAllocateDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>Add funds to this wallet to build its balance for future expenses or savings goals.</DialogDescription>
        </DialogHeader>

        <form onSubmit={allocateFundToWalletFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input onChange={event => states.setAllocateAmount(event.target.value)} placeholder="Allocation's amount" />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={allocateButtonOnClick} type="button">Allocate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
};
