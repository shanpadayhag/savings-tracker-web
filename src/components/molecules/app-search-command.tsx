"use client";

// Global command palette.
// Triggered from the header's faux search input or the ⌘K / Ctrl+K shortcut.
// Loads goals, wallets, and categories on first open and lets cmdk's built-in
// fuzzy filter handle the matching. Selecting a result navigates to the
// section page; the listing pages already host the per-record affordances
// (allocate, edit, archive), so the palette stays purely as a navigator and
// quick-action launcher.

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/atoms/command';
import Routes from '@/enums/routes';
import getCategories from '@/features/categories/api/get-categories';
import Category from '@/features/categories/entities/category';
import getCachedGoals from '@/features/goals/api/get-cached-goals';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus from '@/features/goals/enums/goal-status';
import reconcileLedger from '@/features/user/usecases/reconcile-ledger';
import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import walletRepository from '@/features/wallets/repositories/wallet-repository';
import {
  IconArrowsLeftRight,
  IconCoins,
  IconLayoutDashboard,
  IconReceipt2,
  IconRefresh,
  IconReportAnalytics,
  IconSearch,
  IconSettings,
  IconTags,
  IconTargetArrow,
  IconWallet,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const navigationEntries = [
  { label: 'Dashboard', route: Routes.UserDashboard, icon: <IconLayoutDashboard className="size-4" />, hint: 'Overview & KPIs' },
  { label: 'Goals', route: Routes.UserGoals, icon: <IconTargetArrow className="size-4" />, hint: 'Saving toward' },
  { label: 'Wallets', route: Routes.UserWallets, icon: <IconWallet className="size-4" />, hint: 'Cash on hand' },
  { label: 'Transactions', route: Routes.UserTransactions, icon: <IconReceipt2 className="size-4" />, hint: 'Activity log' },
  { label: 'Categories', route: Routes.UserCategories, icon: <IconTags className="size-4" />, hint: 'Tags' },
  { label: 'Reports', route: Routes.UserReports, icon: <IconReportAnalytics className="size-4" />, hint: 'Insights' },
  { label: 'Account settings', route: Routes.UserAccountSettings, icon: <IconSettings className="size-4" />, hint: 'Profile, data, maintenance' },
];

const AppSearchCommand = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState<GoalListItem[]>([]);
  const [wallets, setWallets] = useState<WalletListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [g, w, c] = await Promise.all([
        getCachedGoals(),
        walletRepository.getWallets(),
        getCategories(),
      ]);
      setGoals(g);
      setWallets(w);
      setCategories(c);
    } catch {
      // Quiet failure — palette will just show navigation.
    }
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = useCallback((route: string) => {
    router.push(route);
    setOpen(false);
  }, [router]);

  const runReconcile = useCallback(async () => {
    setOpen(false);
    await reconcileLedger();
    toast.success('Ledger reconciled', {
      description: 'Balances and the activity log have been rebuilt from your transactions.',
    });
  }, []);

  const visibleGoals = useMemo(
    () => goals.filter(goal => goal.status === GoalStatus.Active).slice(0, 8),
    [goals]);

  return <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open search"
      className="group flex w-72 items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted">
      <IconSearch className="size-4 shrink-0" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
        <span className="text-[11px] leading-none">⌘</span>K
      </kbd>
    </button>

    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search goals, wallets, categories, or jump to a section..." />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Jump to">
          {navigationEntries.map(entry => (
            <CommandItem
              key={entry.route}
              value={`jump ${entry.label} ${entry.hint}`}
              onSelect={() => navigateTo(entry.route)}>
              {entry.icon}
              <span>{entry.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{entry.hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          <CommandItem
            value="reconcile rebuild ledger balances"
            onSelect={runReconcile}>
            <IconRefresh className="size-4" />
            <span>Reconcile ledger</span>
            <CommandShortcut>maintenance</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {visibleGoals.length > 0 && (<>
          <CommandSeparator />
          <CommandGroup heading="Goals">
            {visibleGoals.map(goal => (
              <CommandItem
                key={goal.id}
                value={`goal ${goal.name} ${goal.currency}`}
                onSelect={() => navigateTo(Routes.UserGoals)}>
                <IconTargetArrow className="size-4" />
                <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                  <span className="truncate">{goal.name}</span>
                  <span className="numeral-hero shrink-0 text-xs tabular-nums text-muted-foreground">
                    {goal.savedAmount.format()} <span className="text-muted-foreground/60">/ {goal.targetAmount.format()}</span>
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>)}

        {wallets.length > 0 && (<>
          <CommandSeparator />
          <CommandGroup heading="Wallets">
            {wallets.map(wallet => (
              <CommandItem
                key={wallet.id}
                value={`wallet ${wallet.name} ${wallet.currency}`}
                onSelect={() => navigateTo(Routes.UserWallets)}>
                <IconWallet className="size-4" />
                <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                  <span className="truncate">{wallet.name}</span>
                  <span className="numeral-hero shrink-0 text-xs tabular-nums text-muted-foreground">
                    {wallet.currentAmount.format()}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>)}

        {categories.length > 0 && (<>
          <CommandSeparator />
          <CommandGroup heading="Categories">
            {categories.map(category => (
              <CommandItem
                key={category.id}
                value={`category ${category.name}${category.isSystem ? ' system' : ''}`}
                onSelect={() => navigateTo(Routes.UserCategories)}>
                <span className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true" />
                <span className="truncate">{category.name}</span>
                {category.isSystem && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    System
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </>)}

        <CommandSeparator />
        <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <IconArrowsLeftRight className="size-3" /> Move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconCoins className="size-3" /> Local-only · no account needed
          </span>
        </div>
      </CommandList>
    </CommandDialog>
  </>;
};

export default AppSearchCommand;
