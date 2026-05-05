"use client";

import Routes from '@/enums/routes';
import { cn } from '@/utils/cn';
import { IconBell, IconCreditCard, IconPercentage50, IconUserCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  enabled: boolean;
};

const personalItems: NavItem[] = [
  { href: Routes.UserAccountSettings, label: 'Account', icon: <IconUserCircle className="size-4" />, enabled: true },
];

const workspaceItems: NavItem[] = [
  { href: Routes.UserBillingSettings, label: 'Billing', icon: <IconCreditCard className="size-4" />, enabled: false },
  { href: Routes.UserNotificationsSettings, label: 'Notifications', icon: <IconBell className="size-4" />, enabled: false },
  { href: Routes.UserDisplaySettings, label: 'Display', icon: <IconPercentage50 className="size-4" />, enabled: false },
];

type NavLinkProps = {
  item: NavItem;
  isActive: boolean;
};

const NavLink = ({ item, isActive }: NavLinkProps) => {
  const className = cn(
    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
    isActive && 'bg-foreground text-background font-medium',
    !isActive && item.enabled && 'text-muted-foreground hover:bg-muted hover:text-foreground',
    !item.enabled && 'cursor-not-allowed text-muted-foreground/60',
  );

  const content = (
    <>
      <span className="shrink-0">{item.icon}</span>
      <span className="flex-1 truncate">{item.label}</span>
      {!item.enabled && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Soon
        </span>
      )}
    </>
  );

  if (!item.enabled) {
    return <div className={className} aria-disabled="true">{content}</div>;
  }

  return <Link href={item.href} className={className}>{content}</Link>;
};

export default (props: { children: React.ReactNode; }) => {
  const pathname = usePathname();

  return <div className="flex flex-col h-full overflow-auto pb-8">
    <div className="mx-auto w-full max-w-6xl px-4 pt-6">
      <p className="eyebrow">Settings</p>
    </div>

    <div className="mx-auto mt-6 grid w-full max-w-6xl grid-cols-1 gap-10 px-4 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <nav className="flex flex-col gap-1">
          <p className="eyebrow px-3 pb-2 pt-1">Personal</p>
          {personalItems.map(item => (
            <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
          ))}

          <p className="eyebrow px-3 pb-2 pt-5">Workspace</p>
          {workspaceItems.map(item => (
            <NavLink key={item.href} item={item} isActive={pathname.startsWith(item.href)} />
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {props.children}
      </div>
    </div>
  </div>;
};
