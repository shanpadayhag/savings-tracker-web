import { Button } from '@/components/atoms/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';

type HomeGoalItemActionDropdownProps = {
  allocateMoneyOnClick: () => void;
  spendMoneyOnClick: () => void;
};

const HomeGoalItemActionDropdown = (props: HomeGoalItemActionDropdownProps) => {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
        variant="ghost" size="icon">
        <IconDotsVertical />
        <span className="sr-only">Goal Item Action</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-38">
      <DropdownMenuLabel>Goal</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem disabled>Adjust Amount</DropdownMenuItem>
        <DropdownMenuItem disabled variant="destructive"><span className="text-red-600">Delete Goal</span></DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Transaction</DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem disabled onClick={props.allocateMoneyOnClick}>Allocate Money</DropdownMenuItem>
        <DropdownMenuItem disabled onClick={props.spendMoneyOnClick}>Spend Money</DropdownMenuItem>
        <DropdownMenuItem disabled>Transfer Money</DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
};

export default HomeGoalItemActionDropdown;
