import { Button } from '@/components/atoms/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import { IconDotsVertical } from '@tabler/icons-react';
import { useCallback } from 'react';

export type DashboardGoalItemActionDropdownProps = {
  setAllocateMoneyDialogIsOpen: ReturnType<typeof useDashboardStates>['setAllocateMoneyDialogIsOpen'];
  setSpendMoneyDialogIsOpen: ReturnType<typeof useDashboardStates>['setSpendMoneyDialogIsOpen'];
  setSelectedGoal: ReturnType<typeof useDashboardStates>['setSelectedGoal'];
  selectedGoal: ReturnType<typeof useDashboardStates>['selectedGoal'];
  setArchiveGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['setArchiveGoalDialogIsOpen'];
  setCompleteGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['setCompleteGoalDialogIsOpen'];
};

const DashboardGoalItemActionDropdown = (props: DashboardGoalItemActionDropdownProps) => {
  const spendMoneyOnClick = useCallback(() => {
    props.setSelectedGoal(props.selectedGoal);
    props.setSpendMoneyDialogIsOpen(true);
  }, [props.selectedGoal]);

  const allocateMoneyOnClick = useCallback(() => {
    props.setSelectedGoal(props.selectedGoal);
    props.setAllocateMoneyDialogIsOpen(true);
  }, [props.selectedGoal]);

  const archiveGoalOnClick = useCallback(() => {
    props.setSelectedGoal(props.selectedGoal);
    props.setArchiveGoalDialogIsOpen(true);
  }, [props.selectedGoal]);

  const completeGoalOnClick = useCallback(() => {
    props.setSelectedGoal(props.selectedGoal);
    props.setCompleteGoalDialogIsOpen(true);
  }, [props.selectedGoal]);

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
        variant="ghost" size="icon">
        <IconDotsVertical />
        <span className="sr-only">Goal Item Action</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-38">
      <DropdownMenuLabel>Transaction</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={allocateMoneyOnClick}>Allocate Money</DropdownMenuItem>
        <DropdownMenuItem onClick={spendMoneyOnClick}>Spend Money</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Goal</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem disabled>Adjust Amount</DropdownMenuItem>
        <DropdownMenuItem onClick={completeGoalOnClick}>Complete Goal</DropdownMenuItem>
        <DropdownMenuItem onClick={archiveGoalOnClick}><span className="text-red-700">Archive Goal</span></DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
};

export default DashboardGoalItemActionDropdown;
