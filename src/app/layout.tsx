import type { Metadata } from "next";
import { Toaster } from "@/components/atoms/sonner";

import "@/assets/css/tailwind.css";
import { ThemeProvider } from '@/components/atoms/theme-provider';
import AuthProvider from '@/features/auth/components/atoms/AuthProvider';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
