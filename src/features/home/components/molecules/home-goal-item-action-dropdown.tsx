import { Button } from '@/components/atoms/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import useHomeStates from '@/features/home/states/home-states';
import { IconDotsVertical } from '@tabler/icons-react';
import { useCallback } from 'react';

type HomeGoalItemActionDropdownProps = {
  allocateMoneyOnClick: (value: true) => void;
  spendMoneyOnClick: (value: true) => void;
  setSelectedGoal: ReturnType<typeof useHomeStates>['setSelectedGoal'];
  goal: ReturnType<typeof useHomeStates>['selectedGoal'];
};

const HomeGoalItemActionDropdown = (props: HomeGoalItemActionDropdownProps) => {
  const spendMoneyOnClick = useCallback(() => {
    props.setSelectedGoal(props.goal);
    props.spendMoneyOnClick(true);
  }, []);

  const allocateMoneyOnClick = useCallback(() => {
    props.setSelectedGoal(props.goal);
    props.allocateMoneyOnClick(true);
  }, []);

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
        <DropdownMenuItem disabled onClick={allocateMoneyOnClick}>Allocate Money</DropdownMenuItem>
        <DropdownMenuItem onClick={spendMoneyOnClick}>Spend Money</DropdownMenuItem>
        <DropdownMenuItem disabled>Transfer Money</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Goal</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem disabled>Adjust Amount</DropdownMenuItem>
        <DropdownMenuItem disabled>Complete Goal</DropdownMenuItem>
        <DropdownMenuItem disabled>Archive Goal</DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
};

export default HomeGoalItemActionDropdown;
