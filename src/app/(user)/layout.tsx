"use client";

import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import UserLayoutHeader from '@/components/organisms/user-layout-header';
import UserLayoutSidebar from '@/components/organisms/user-layout-sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default ({ children }: { children: React.ReactNode; }) => {
  const isMobile = useIsMobile();

  const user = {
    name: "Jim Paul", email: "jpp@savingstracker.com",
    initials: "J P P".split(/\s+/)
      .filter(n => n.length > 0)
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 3)
      .join('')
  };

  return <div className="max-w-screen max-h-screen">
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
  </div>;
};
