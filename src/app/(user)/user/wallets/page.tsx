"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import Combobox from '@/components/molecules/combobox';
import Currency, { currencyLabel } from '@/enums/currency';
import useWalletsEvents from '@/features/wallets/events/wallets-events';
import useWalletsStates from '@/features/wallets/states/wallets-states';
import dateUtil from '@/utils/date-util';
import { IconDotsVertical } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect } from 'react';

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

  return <>
    <div className="flex flex-col overflow-auto h-full pb-2 gap-6">
      <div className="w-full px-4 pt-4">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Wallets</h1>
        <p className="text-sm text-muted-foreground font-light">Create and manage wallets to track real account balances before allocating funds to goals.</p>
      </div>

      <div className="flex justify-between items-center px-4">
        <div><Input disabled className="w-70" placeholder="Search for wallet" /></div>
        <div><Button onClick={() => states.setCreateWalletDialogIsOpen(true)}>New Wallet</Button></div>
      </div>

      <div className="border-y">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-0">
            <TableRow>
              <TableHead colSpan={1}><span className="sr-only">Drag</span></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Current Amount</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {states.wallets.length > 0
              ? <>{states.wallets.map(wallet => <TableRow key={wallet.id}>
                <TableCell></TableCell>
                <TableCell className="py-4">{wallet.name}</TableCell>
                <TableCell>{currencyLabel[wallet.currency]}</TableCell>
                <TableCell>{wallet.currentAmount.format()}</TableCell>
                <TableCell>{dateUtil.formatDisplayDate(wallet.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
                        variant="ghost" size="icon">
                        <IconDotsVertical /> <span className="sr-only">Wallet Item Action</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-38">
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
                        <DropdownMenuItem disabled><span className="text-red-700">Archive Wallet</span></DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>)}</>
              : <TableRow>
                <TableCell className="h-24 text-center" colSpan={6}>
                  No wallets.
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
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
