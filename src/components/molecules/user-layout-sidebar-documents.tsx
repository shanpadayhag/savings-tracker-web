"use client";

import { IconReport } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Routes from '@/enums/routes';

const UserLayoutSidebarDocuments = () => {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem >
          <SidebarMenuButton isActive={pathname.startsWith(Routes.UserReports)} tooltip="Reports" asChild>
            <Link href={Routes.UserReports}><IconReport /> <span>Reports</span></Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

export default UserLayoutSidebarDocuments;
