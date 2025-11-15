import { Button } from '@/components/atoms/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import { IconDotsVertical } from '@tabler/icons-react';
import { useCallback } from 'react';

export type HomeGoalItemActionDropdownProps = {
  setAllocateMoneyDialogIsOpen: ReturnType<typeof useHomeStates>['setAllocateMoneyDialogIsOpen'];
  setSpendMoneyDialogIsOpen: ReturnType<typeof useHomeStates>['setSpendMoneyDialogIsOpen'];
  setSelectedGoal: ReturnType<typeof useHomeStates>['setSelectedGoal'];
  selectedGoal: ReturnType<typeof useHomeStates>['selectedGoal'];
  setArchiveGoalDialogIsOpen: ReturnType<typeof useHomeStates>['setArchiveGoalDialogIsOpen'];
  setCompleteGoalDialogIsOpen: ReturnType<typeof useHomeStates>['setCompleteGoalDialogIsOpen'];
};

const HomeGoalItemActionDropdown = (props: HomeGoalItemActionDropdownProps) => {
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

export default HomeGoalItemActionDropdown;
