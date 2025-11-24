"use client";

import { Input } from '@/components/atoms/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';

export default () => {
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
              <TableHead>Goal Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* {states.wallets.length > 0
              ? <>{states.wallets.map(wallet => <TableRow key={wallet.id}>
                <TableCell></TableCell>
                <TableCell className="py-4">{wallet.name}</TableCell>
                <TableCell>{currencyLabel[wallet.currency]}</TableCell>
                <TableCell>{dateUtil.formatDisplayDate(wallet.createdAt)}</TableCell>
              </TableRow>)}</>
              : <TableRow>
                <TableCell className="h-24 text-center" colSpan={5}>
                  No transactions.
                </TableCell>
              </TableRow>} */}
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={6}>
                No transactions.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </>;
};
