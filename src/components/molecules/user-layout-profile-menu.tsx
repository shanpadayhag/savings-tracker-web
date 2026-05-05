import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import Routes from '@/enums/routes';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { IconBell, IconCreditCard, IconLogout, IconUserCircle } from '@tabler/icons-react';
import Link from 'next/link';

type UserLayoutProfileMenuProps = {
  children: React.ReactNode;
  user: { name: string; email: string; initials: string; };
  dropdownMenuTriggerAsChild?: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>['asChild'];
  dropdownMenuContentSide: React.ComponentProps<typeof DropdownMenuPrimitive.Content>['side'];
};

const SoonChip = () => (
  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
    Soon
  </span>
);

const UserLayoutProfileMenu = (props: UserLayoutProfileMenuProps) => {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild={props.dropdownMenuTriggerAsChild}>
      {props.children}
    </DropdownMenuTrigger>
    <DropdownMenuContent
      side={props.dropdownMenuContentSide}
      align="end" sideOffset={6}
      className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl p-1.5">
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-3 rounded-lg p-2 text-left text-sm">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background text-xs font-semibold tracking-tight"
            aria-hidden="true">
            {props.user.initials}
          </div>
          <div className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{props.user.name}</span>
            {props.user.email
              ? <span className="text-muted-foreground truncate text-xs">{props.user.email}</span>
              : <span className="text-muted-foreground/60 truncate text-xs italic">No email set</span>}
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={Routes.UserAccountSettings}>
            <IconUserCircle /> Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <IconCreditCard /> Billing <SoonChip />
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <IconBell /> Notifications <SoonChip />
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>
        <IconLogout /> Log out <SoonChip />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
};

export default UserLayoutProfileMenu;
