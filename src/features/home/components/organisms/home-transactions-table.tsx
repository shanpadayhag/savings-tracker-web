import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import useHomeStates from '@/features/home/states/home-states';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';

type HomeTransactionsTableProps = {
  transactionList: ReturnType<typeof useHomeStates>['transactionList'];
};

const HomeTransactionsTable = (props: HomeTransactionsTableProps) => {
  return <div className="flex flex-col gap-4 px-4 md:gap-6 w-full">
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead colSpan={1}><span className="sr-only">Drag</span></TableHead>
            <TableHead colSpan={1}>Activity</TableHead>
            <TableHead colSpan={1}>Description</TableHead>
            <TableHead colSpan={1}>Amount</TableHead>
            <TableHead colSpan={1}>Timestamp</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {props.transactionList.length > 0
            ? props.transactionList.map(transaction => <TableRow className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
              key={transaction.id!}
              // data-state="selected"
              data-state="false">
              <TableCell></TableCell>
              <TableCell className="py-4">{transaction.activity}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{currencyUtil.format(transaction.goalActivity!.amount)}</TableCell>
              <TableCell>{dateUtil.formatDisplayDate(new Date(transaction.createdAt!))}</TableCell>
            </TableRow>)
            : <TableRow>
              <TableCell className="h-24 text-center" colSpan={6}>
                No results.
              </TableCell>
            </TableRow>}
        </TableBody>
      </Table>
    </div>
  </div>;
};

export default HomeTransactionsTable;
