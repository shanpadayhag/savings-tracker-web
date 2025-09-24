import { Progress } from '@/components/atoms/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import HomeGoalItemActionDropdown, { HomeGoalItemActionDropdownProps } from '@/features/home/components/molecules/home-goal-item-action-dropdown';
import useHomeStates from '@/features/home/states/home-states';
import { currencyUtil } from '@/utils/currency-util';
import currency from 'currency.js';

type HomeGoalTableProps = {
  goalList: ReturnType<typeof useHomeStates>['goalList'];
} & HomeGoalItemActionDropdownProps;

const HomeGoalTable = (props: HomeGoalTableProps) => {
  return <div className="flex flex-col gap-4 p-4 md:gap-6 w-full">
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead colSpan={1}><span className="sr-only">Drag</span></TableHead>
            <TableHead colSpan={1}>Goal Name</TableHead>
            <TableHead colSpan={1}>Target Amount</TableHead>
            <TableHead colSpan={1}>Progess</TableHead>
            <TableHead colSpan={1}>Saved Amount</TableHead>
            <TableHead colSpan={1}><span className="sr-only">Action</span></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {props.goalList.length
            ? props.goalList.map(goal => {
              const calculatedProgress = currency(goal.currentAmount)
                .multiply(100)
                .divide(goal.targetAmount)
                .value;

              return <TableRow className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                key={goal.id}
                // data-state="selected"
                data-state="false">
                <TableCell></TableCell>
                <TableCell>{goal.name}</TableCell>
                <TableCell>{currencyUtil.format(goal.targetAmount)}</TableCell>
                <TableCell><span className="flex items-center gap-2">
                  <Progress value={calculatedProgress} className="w-30"/>
                  {calculatedProgress}%
                </span></TableCell>
                <TableCell>{currencyUtil.format(goal.currentAmount)}</TableCell>
                <TableCell><HomeGoalItemActionDropdown
                  setAllocateMoneyDialogIsOpen={props.setAllocateMoneyDialogIsOpen}
                  setSpendMoneyDialogIsOpen={props.setSpendMoneyDialogIsOpen}
                  setSelectedGoal={props.setSelectedGoal}
                  selectedGoal={{ id: goal.id || "", name: goal.name }} /></TableCell>
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

export default HomeGoalTable;
