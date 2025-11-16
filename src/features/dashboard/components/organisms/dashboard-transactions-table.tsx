import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import Currency from '@/enums/currency';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';

type DashboardTransactionsTableProps = {
  authUser: ReturnType<typeof useDashboardStates>['authUser'];
  transactionList: ReturnType<typeof useDashboardStates>['transactionList'];
};

const DashboardTransactionsTable = (props: DashboardTransactionsTableProps) => {
  return <div className="flex flex-col gap-4 px-4 md:gap-6 w-full">
    <div className="overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-0">
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
              <TableCell className="py-4"></TableCell>
              <TableCell className="py-4 whitespace-normal break-keep">{transaction.activity}</TableCell>
              <TableCell className="py-4 whitespace-normal break-keep">{transaction.description}</TableCell>
              <TableCell className="py-4">{currencyUtil.format(transaction.goalActivity!.amount, props.authUser?.financialSummary.currency || Currency.Euro)}</TableCell>
              <TableCell className="py-4">{dateUtil.formatDisplayDate(new Date(transaction.createdAt!))}</TableCell>
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

export default DashboardTransactionsTable;
