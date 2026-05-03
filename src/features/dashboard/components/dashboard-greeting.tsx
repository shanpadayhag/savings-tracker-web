"use client";

// Greeting header for the dashboard.
// Renders a time-of-day-aware salutation alongside today's date so the page
// feels personal when a user lands here from the sidebar.

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
    <div className="w-full px-4 pt-4">
      <h1 className="text-xl font-semi font-serif lg:text-2xl">
        {greetingFor(now)}, {name}
      </h1>
      <p className="text-sm text-muted-foreground font-light">
        Here's how your money is doing on {format(now, 'EEEE, MMMM d')}.
      </p>
    </div>
  );
};

export default DashboardGreeting;
