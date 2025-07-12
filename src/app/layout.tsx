import { SidebarInset, SidebarProvider } from '@/components/atoms/sidebar';
import { AppSidebar } from '@/components/molecules/app-sidebar';
import type { Metadata } from "next";

import "@/assets/css/tailwind.css";

export const metadata: Metadata = {
  title: "Savings Tracker",
  description: "Created by Shan Padayhag",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        > */}
          {/* <AppSidebar variant="inset" /> */}
          {/* <SidebarInset> */}
            {children}
          {/* </SidebarInset> */}
        {/* </SidebarProvider> */}
      </body>
    </html>
  );
}
