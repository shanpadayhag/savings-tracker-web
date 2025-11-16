import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { IconCreditCard, IconLogout, IconNotification, IconUserCircle } from '@tabler/icons-react';

type UserLayoutProfileMenuProps = {
  children: React.ReactNode;
  user: { name: string; email: string; initials: string; };
  dropdownMenuTriggerAsChild?: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>['asChild'];
  dropdownMenuContentSide: React.ComponentProps<typeof DropdownMenuPrimitive.Content>['side'];
};

const UserLayoutProfileMenu = (props: UserLayoutProfileMenuProps) => {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild={props.dropdownMenuTriggerAsChild}>
      {props.children}
    </DropdownMenuTrigger>
    <DropdownMenuContent
      side={props.dropdownMenuContentSide}
      align="end" sideOffset={4}
      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage alt={"JP"} />
            <AvatarFallback className="rounded-lg">{props.user.initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{props.user.name}</span>
            <span className="text-muted-foreground truncate text-xs">{props.user.email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem disabled><IconUserCircle /> Account</DropdownMenuItem>
        <DropdownMenuItem disabled><IconCreditCard /> Billing</DropdownMenuItem>
        <DropdownMenuItem disabled><IconNotification /> Notifications</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled><IconLogout /> Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
};

export default UserLayoutProfileMenu;
