"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
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
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem disabled><span className="text-red-700">Archive Goal</span></DropdownMenuItem>
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
