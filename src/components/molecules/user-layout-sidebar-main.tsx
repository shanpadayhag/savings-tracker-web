"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/atoms/sidebar";
import Routes from '@/enums/routes';
import { IconCirclePlusFilled, IconCreditCardPay, IconDashboard, IconTargetArrow, IconWallet } from "@tabler/icons-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const UserLayoutSidebarMain = () => {
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
              {/* <span>Quick Transaction</span> */}
              <span>QT (Coming Soon)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname.startsWith(Routes.UserDashboard)} tooltip="Dashboard" asChild>
              <Link href={Routes.UserDashboard}><IconDashboard /> <span>Dashboard</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem >
            <SidebarMenuButton isActive={pathname.startsWith(Routes.UserTransactions)} tooltip="Transactions" asChild>
              <Link href={Routes.UserTransactions}><IconCreditCardPay /> <span>Transactions</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem >
            <SidebarMenuButton isActive={pathname.startsWith(Routes.UserGoals)} tooltip="Goals" asChild>
              <Link href={Routes.UserGoals}><IconTargetArrow /> <span>Goals</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem >
            <SidebarMenuButton isActive={pathname.startsWith(Routes.UserWallets)} tooltip="Wallets" asChild>
              <Link href={Routes.UserWallets}><IconWallet /> <span>Wallets</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default UserLayoutSidebarMain;
