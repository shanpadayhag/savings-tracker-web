"use client";

import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import UserLayoutHeader from '@/components/organisms/user-layout-header';
import UserLayoutSidebar from '@/components/organisms/user-layout-sidebar';
import { ActiveCurrencyProvider } from '@/contexts/active-currency-context';
import { CurrentUserProvider, useCurrentUser } from '@/contexts/current-user-context';
import { useIsMobile } from '@/hooks/use-mobile';

const UserLayoutShell = ({ children }: { children: React.ReactNode; }) => {
  const isMobile = useIsMobile();
  const { displayName, email, initials } = useCurrentUser();
  const user = { name: displayName, email, initials };

  return (
    <SidebarProvider style={{
      "--sidebar-width": "calc(var(--spacing) * 72)",
      "--header-height": "calc(var(--spacing) * 15)",
    } as React.CSSProperties}>
      <UserLayoutSidebar
        user={user}
        dropdownMenuContentSide={isMobile ? "top" : "right"}
        sidebar={{ variant: "inset" }} />
      <SidebarInset className="overflow-auto">
        <UserLayoutHeader
          user={user}
          dropdownMenuContentSide="bottom" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ({ children }: { children: React.ReactNode; }) => {
  return <div className="max-w-screen max-h-screen">
    <CurrentUserProvider>
      <ActiveCurrencyProvider>
        <UserLayoutShell>{children}</UserLayoutShell>
      </ActiveCurrencyProvider>
    </CurrentUserProvider>
  </div>;
};
