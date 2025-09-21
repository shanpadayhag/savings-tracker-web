import { Button } from '@/components/atoms/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { IconDotsVertical } from '@tabler/icons-react';

type HomeMainActionSectionProps = {
  adjustBalanceOnClick: (value: true) => void;
  newGoalOnClick: (value: true) => void;
  exportTransactionsOnClick: () => void;
  importTransactionsOnClick: () => void;
};

const HomeMainActionSection = (props: HomeMainActionSectionProps) => {
  return <div className="flex justify-end gap-2 p-4 w-full max-w-[500px]">
    <Button onClick={() => props.newGoalOnClick(true)}>New Goal</Button>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
          variant="outline" size="icon">
          <IconDotsVertical />
          <span className="sr-only">Home Main</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-38">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => props.adjustBalanceOnClick(true)}>Adjust Balance</DropdownMenuItem>
          <DropdownMenuItem disabled>Account Reset</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Transaction</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={props.exportTransactionsOnClick}>Export Data</DropdownMenuItem>
          <DropdownMenuItem onClick={props.importTransactionsOnClick}>Import Data</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
};

export default HomeMainActionSection;
