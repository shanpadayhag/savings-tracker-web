import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { Separator } from "@/components/atoms/separator";
import { SidebarTrigger } from "@/components/atoms/sidebar";
import Combobox from '@/components/molecules/combobox';
import UserLayoutProfileMenu from '@/components/molecules/user-layout-profile-menu';
import Routes from '@/enums/routes';
import { IconBell, IconMoon, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';

type UserLayoutHeaderProps = {
  user: React.ComponentProps<typeof UserLayoutProfileMenu>['user'];
  dropdownMenuContentSide: React.ComponentProps<typeof UserLayoutProfileMenu>['dropdownMenuContentSide'];
};

const UserLayoutHeader = (props: UserLayoutHeaderProps) => {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex justify-between w-full">
          <div className="w-60">
            <Combobox disabled
              placeholder="Search... (Coming Soon)" />
          </div>
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="flex items-center gap-4 lg:gap-6">
              <IconBell className="size-4 text-muted-foreground" />
              <IconMoon className="size-4 text-muted-foreground" />
              <Link href={Routes.UserSettings}><IconSettings className="size-4" /></Link>
            </div>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <UserLayoutProfileMenu user={props.user} dropdownMenuContentSide={props.dropdownMenuContentSide}>
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage alt={"JP"} />
                <AvatarFallback className="rounded-lg">{props.user.initials}</AvatarFallback>
              </Avatar>
            </UserLayoutProfileMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserLayoutHeader;
