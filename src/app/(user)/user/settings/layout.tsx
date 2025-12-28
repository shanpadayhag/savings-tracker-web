"use client";

import { Card, CardContent } from '@/components/atoms/card';
import Routes from '@/enums/routes';
import { IconBell, IconCreditCard, IconPercentage50, IconUserCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default (props: { children: React.ReactNode; }) => {
  const pathname = usePathname();

  return <div className="flex flex-col overflow-auto h-full pb-2 gap-6">
    <div className="w-full px-4 pt-4">
      <h1 className="text-xl font-semi font-serif lg:text-2xl">Settings</h1>
      <p className="text-sm text-muted-foreground font-light">Manage your account settings and set e-mail preferences.</p>
    </div>

    <div className="px-4 flex gap-4">
      <div>
        <Card className="w-90 py-2">
          <CardContent className="px-2">
            <Link href={Routes.UserAccountSettings} data-active={pathname.startsWith(Routes.UserAccountSettings)} className="data-[active=true]:bg-sidebar-accent hover:bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <IconUserCircle className="size-5" /> Account <span className="text-muted-foreground text-xs">(Coming Soon)</span>
            </Link>
            <Link href={Routes.UserBillingSettings} data-active={pathname.startsWith(Routes.UserBillingSettings)} className="data-[active=true]:bg-sidebar-accent hover:bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <IconCreditCard className="size-5" /> Billing <span className="text-muted-foreground text-xs">(Coming Soon)</span>
            </Link>
            <Link href={Routes.UserNotificationsSettings} data-active={pathname.startsWith(Routes.UserNotificationsSettings)} className="data-[active=true]:bg-sidebar-accent hover:bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <IconBell className="size-5" /> Notifications <span className="text-muted-foreground text-xs">(Coming Soon)</span>
            </Link>
            <Link href={Routes.UserDisplaySettings} data-active={pathname.startsWith(Routes.UserDisplaySettings)} className="data-[active=true]:bg-sidebar-accent hover:bg-muted rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <IconPercentage50 className="size-5" /> Display <span className="text-muted-foreground text-xs">(Coming Soon)</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        {props.children}
      </div>
    </div>
  </div>;
};
