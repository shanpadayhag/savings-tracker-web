"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar";
import UserLayoutProfileMenu from '@/components/molecules/user-layout-profile-menu';
import UserLayoutSidebarDocuments from '@/components/molecules/user-layout-sidebar-documents';
import UserLayoutSidebarMain from '@/components/molecules/user-layout-sidebar-main';
import Routes from '@/enums/routes';
import { IconDotsVertical, IconPigFilled } from '@tabler/icons-react';

type UserLayoutSidebarProps = {
  user: React.ComponentProps<typeof UserLayoutProfileMenu>['user'];
  dropdownMenuContentSide: React.ComponentProps<typeof UserLayoutProfileMenu>['dropdownMenuContentSide'];
  sidebar: React.ComponentProps<typeof Sidebar>;
};

const UserLayoutSidebar = (props: UserLayoutSidebarProps) => {
  return <Sidebar collapsible="offcanvas" {...props.sidebar}>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
            <a href={Routes.UserDashboard}>
              <IconPigFilled className="!size-6 fill-[#C96542]" />
              <span className="text-base font-semibold">Savings Tracker</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <UserLayoutSidebarMain />
      <UserLayoutSidebarDocuments />
    </SidebarContent>
    <SidebarFooter>
      <UserLayoutProfileMenu dropdownMenuTriggerAsChild
        user={props.user}
        dropdownMenuContentSide={props.dropdownMenuContentSide}>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarImage alt={props.user.name} />
            <AvatarFallback className="rounded-lg">{props.user.initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Jim Paul</span>
            <span className="text-muted-foreground truncate text-xs">
              jpp@savingstracker.com
            </span>
          </div>
          <IconDotsVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </UserLayoutProfileMenu>
    </SidebarFooter>
  </Sidebar>;
};

export default UserLayoutSidebar;
