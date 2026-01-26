"use client";

import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import TransactionType, { transactionTypeLabel } from '@/features/transactions/enums/transaction-type';
import useTransactionsEvents from '@/features/transactions/events/use-transactions-events';
import useTransactionsStates from '@/features/transactions/states/use-transactions-states';
import dateUtil from '@/utils/date-util';
import { useEffect } from 'react';

export default () => {
  const states = useTransactionsStates();
  const events = useTransactionsEvents(states);

  useEffect(() => {
    events.handleFetchTransactions();
  }, []);

  return <>
    <div className="flex flex-col overflow-auto h-full pb-2 gap-6">
      <div className="w-full px-4 pt-4">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Transactions</h1>
        <p className="text-sm text-muted-foreground font-light">A detailed log of all your financial activities. Search and filter to find what you need.</p>
      </div>

      <div className="flex justify-between items-center px-4">
        <div><Input disabled className="w-70" placeholder="Search for transaction" /></div>
      </div>

      <div className="border-y">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-0">
            <TableRow>
              <TableHead><span className="sr-only">Drag</span></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {states.transactions.length > 0
              ? <>{states.transactions.map(transaction => <TableRow key={transaction.id}>
                <TableCell></TableCell>
                <TableCell className="py-4">{dateUtil.formatDisplayDate(transaction.createdAt)}</TableCell>
                <TableCell>
                  {transaction.type === TransactionType.Allocate && <Badge variant="default">{transactionTypeLabel[transaction.type]}</Badge>}
                  {transaction.type === TransactionType.Spend && <Badge variant="secondary">{transactionTypeLabel[transaction.type]}</Badge>}
                </TableCell>
                <TableCell>{transaction.from || <span className="text-muted-foreground text-xs opacity-50">None</span>}</TableCell>
                <TableCell>{transaction.to || <span className="text-muted-foreground text-xs opacity-50">None</span>}</TableCell>
                {/* <TableCell>{transaction.amount.length > 1
                  ? transaction.amount[0].format() + " → " + transaction.amount[1].format()
                  : transaction.amount[0].format()}</TableCell> */}
                <TableCell>{transaction.amount[0].format()}</TableCell>
                <TableCell>{transaction.fee?.format() || <span className="text-muted-foreground text-xs opacity-50">None</span>}</TableCell>
                <TableCell>{transaction.notes || <span className="text-muted-foreground text-xs opacity-50">None</span>}</TableCell>
              </TableRow>)}</>
              : <TableRow>
                <TableCell className="h-24 text-center" colSpan={8}>
                  No transactions.
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  </>;
};
