import { Progress } from '@/components/atoms/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import Currency from '@/enums/currency';
import DashboardGoalItemActionDropdown, { DashboardGoalItemActionDropdownProps } from '@/features/dashboard/components/molecules/dashboard-goal-item-action-dropdown';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import currencyUtil from '@/utils/currency-util';
import currency from 'currency.js';

type DashboardGoalTableProps = {
  authUser: ReturnType<typeof useDashboardStates>['authUser'];
  goalList: ReturnType<typeof useDashboardStates>['goalList'];
} & DashboardGoalItemActionDropdownProps;

const DashboardGoalTable = (props: DashboardGoalTableProps) => {
  return <div className="flex flex-col gap-4 px-4 md:gap-6 w-full">
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead colSpan={1}><span className="sr-only">Drag</span></TableHead>
            <TableHead colSpan={1}>Goal Name</TableHead>
            <TableHead colSpan={1}>Target Amount</TableHead>
            <TableHead colSpan={1}>Progess</TableHead>
            <TableHead colSpan={1}>Saved Amount</TableHead>
            <TableHead colSpan={1}>Remaining Amount</TableHead>
            <TableHead colSpan={1}><span className="sr-only">Action</span></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {props.goalList.length
            ? props.goalList.map(goal => {
              const calculatedProgress = currency(goal.currentAmount, { precision: 2, decimal: ',', pattern: `# %` })
                .multiply(100)
                .divide(goal.targetAmount);

              return <TableRow className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                key={goal.id}
                // data-state="selected"
                data-state="false">
                <TableCell></TableCell>
                <TableCell>{goal.name}</TableCell>
                <TableCell>{currencyUtil.format(goal.targetAmount, props.authUser?.financialSummary.currency || Currency.Euro)}</TableCell>
                <TableCell><span className="flex items-center gap-2">
                  <Progress value={calculatedProgress.value} className="w-30" />
                  {calculatedProgress.format()}
                </span></TableCell>
                <TableCell>{currencyUtil.format(goal.currentAmount, props.authUser?.financialSummary.currency || Currency.Euro)}</TableCell>
                <TableCell>{currencyUtil.parse(goal.targetAmount, props.authUser?.financialSummary.currency || Currency.Euro).subtract(goal.currentAmount).format()}</TableCell>
                <TableCell><DashboardGoalItemActionDropdown
                  setAllocateMoneyDialogIsOpen={props.setAllocateMoneyDialogIsOpen}
                  setSpendMoneyDialogIsOpen={props.setSpendMoneyDialogIsOpen}
                  setArchiveGoalDialogIsOpen={props.setArchiveGoalDialogIsOpen}
                  setCompleteGoalDialogIsOpen={props.setCompleteGoalDialogIsOpen}
                  setSelectedGoal={props.setSelectedGoal}
                  selectedGoal={goal} /></TableCell>
              </TableRow>;
            })
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

export default DashboardGoalTable;
