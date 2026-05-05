"use client";

// Greeting header for the dashboard.
// Renders a time-of-day-aware salutation alongside today's date so the page
// feels personal when a user lands here from the sidebar. Hosts the global
// currency switcher on the right so users with multiple currencies can
// reframe the entire page in one click.

import CurrencySwitcher from '@/components/molecules/currency-switcher';
import { format } from 'date-fns';

const greetingFor = (date: Date) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

type DashboardGreetingProps = {
  name: string;
};

const DashboardGreeting = ({ name }: DashboardGreetingProps) => {
  const now = new Date();

  return (
    <div className="w-full px-4 pt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{format(now, 'EEEE · MMMM d')}</p>
        <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">
          {greetingFor(now)}, {name}.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Here's where your money stands today.
        </p>
      </div>
      <CurrencySwitcher />
    </div>
  );
};

export default DashboardGreeting;
