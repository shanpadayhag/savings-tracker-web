"use client";

import { IconCirclePlusFilled, IconDashboard, IconMail, IconTargetArrow, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar";
import Link from 'next/link';
import Routes from '@/enums/routes';
import { usePathname } from 'next/navigation';

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              disabled
              tooltip="Quick Transaction"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
              <IconCirclePlusFilled />
              {/* <span>Quick Transaction (Coming Soon)</span> */}
              <span>QT (Coming Soon)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname.startsWith(Routes.UserDashboard)} tooltip="Dashboard" asChild>
              <Link href={Routes.UserDashboard}>
                <IconDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem >
            <SidebarMenuButton tooltip="Goal" asChild>
              <Link href="#">
                <IconTargetArrow />
                <span>Goal</span> <span className="text-muted-foreground">(Coming Soon)</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
