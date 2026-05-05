import { buttonVariants } from '@/components/atoms/button';
import Logo from '@/components/atoms/logo';
import Routes from '@/enums/routes';
import { IconArrowUpRight } from '@tabler/icons-react';
import Link from 'next/link';

const goalSnapshots = [
  { name: 'Emergency Fund', saved: 8_200, target: 10_000 },
  { name: 'Trip to Japan', saved: 1_820, target: 3_500 },
  { name: 'New Lens', saved: 740, target: 1_800 },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const principles = [
  {
    num: '01',
    title: 'Saved beats spent.',
    body: 'Every screen leads with what\'s growing or remaining, not what was lost. Spending is reported, never headlined.',
  },
  {
    num: '02',
    title: 'Money has names.',
    body: 'Numbers without context are noise. Every figure pairs with the goal, wallet, or category it belongs to.',
  },
  {
    num: '03',
    title: 'One question, one number.',
    body: 'Each screen answers one question well, not five questions partially. Charts earn their place.',
  },
];

const negations = [
  {
    tag: 'Not a budget.',
    body: 'You won\'t pre-allocate envelopes you\'ll never refill. Save first, decide later.',
  },
  {
    tag: 'Not a chart wall.',
    body: 'One chart per question, not five fighting for attention. The page should answer, not impress.',
  },
  {
    tag: 'Not a bank dashboard.',
    body: 'No "Welcome back, valued client." No nine-digit account number greeting you.',
  },
];

export default () => {
  const totalSaved = goalSnapshots.reduce((sum, goal) => sum + goal.saved, 0);

  return <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
    <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/" className="flex items-center gap-3">
        <Logo size={32} />
        <span className="font-medium tracking-tight">Savings Tracker</span>
      </Link>
      <nav className="flex items-center gap-2">
        <Link href={Routes.UserDashboard}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Sign in
        </Link>
        <Link href={Routes.UserDashboard}
          className={buttonVariants({ size: 'sm' })}>
          Open the tracker
        </Link>
      </nav>
    </header>

    <section className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-14 px-6 pb-24 pt-12 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pt-24">
      <div className="lg:col-span-7">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          A savings tracker, not a budget app
        </p>
        <h1 className="heading-display mt-6 text-balance text-[clamp(2.75rem,7vw,5.75rem)] font-semibold leading-[0.95] tracking-[-0.03em]">
          Save toward something{' '}
          <span className="relative inline-block whitespace-nowrap">
            specific
            <span aria-hidden className="absolute inset-x-0 -bottom-1 h-[6px] rounded-full bg-primary/80" />
          </span>.
        </h1>
        <p className="mt-8 max-w-[42ch] text-pretty text-lg text-muted-foreground">
          Most apps show you where the money went. This one shows you how close you are to where it's going.
        </p>
        <p className="mt-3 max-w-[42ch] text-sm text-muted-foreground/80">
          Goals with names. Balances at a glance. No budget envelopes, no chart wallpaper.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href={Routes.UserDashboard}
            className={`${buttonVariants({ size: 'lg' })} gap-2 rounded-full px-7 py-6 text-base`}>
            Open the tracker
            <IconArrowUpRight className="size-4" />
          </Link>
          <span className="text-xs text-muted-foreground">Local-first. No account required.</span>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="relative">
          <div aria-hidden className="absolute -left-3 -top-3 h-full w-full rounded-2xl border-2 border-primary/30" />
          <div className="relative rounded-2xl border bg-card shadow-md">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <Logo size={22} />
                <span className="text-sm font-medium">Goals</span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                3 active &middot; USD
              </span>
            </div>
            <ul className="divide-y">
              {goalSnapshots.map(goal => {
                const pct = Math.round((goal.saved / goal.target) * 100);
                return <li key={goal.name} className="px-6 py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">{goal.name}</span>
                    <span className="numeral-hero text-sm tabular-nums text-muted-foreground">
                      <span className="text-foreground">{formatMoney(goal.saved)}</span>
                      <span className="text-muted-foreground/60"> / {formatMoney(goal.target)}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="numeral-hero w-10 text-right text-xs font-semibold tabular-nums text-foreground/80">
                      {pct}%
                    </span>
                  </div>
                </li>;
              })}
            </ul>
            <div className="flex items-center justify-between border-t bg-muted/40 px-6 py-3 text-xs">
              <span className="text-muted-foreground">Saved across all goals</span>
              <span className="numeral-hero font-semibold tabular-nums">{formatMoney(totalSaved)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-t border-foreground/10 bg-foreground/[0.02]">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-20 lg:px-10 lg:py-28">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          What it leans on
        </p>
        <h2 className="heading-display mt-4 max-w-[24ch] text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Three rules, no extras.
        </h2>
        <div className="mt-14 grid gap-12 sm:grid-cols-3 lg:gap-10">
          {principles.map(principle => (
            <div key={principle.num}>
              <div className="font-mono text-2xl font-semibold tabular-nums text-primary">{principle.num}</div>
              <h3 className="heading-display mt-4 text-xl font-semibold tracking-tight">
                {principle.title}
              </h3>
              <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
                {principle.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section>
      <div className="mx-auto w-full max-w-[1180px] px-6 py-20 lg:px-10 lg:py-28">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          What it isn't
        </p>
        <h2 className="heading-display mt-4 max-w-[22ch] text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          A few things it explicitly isn't.
        </h2>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          {negations.map(item => (
            <li key={item.tag} className="bg-background p-8">
              <h3 className="heading-display text-lg font-semibold tracking-tight">{item.tag}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)' }} />
      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col items-start gap-10 px-6 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-28">
        <div>
          <p className="eyebrow !text-primary-foreground/70">Get started</p>
          <h2 className="heading-display mt-4 max-w-[18ch] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Name a goal. Watch it fill.
          </h2>
        </div>
        <Link href={Routes.UserDashboard}
          className="inline-flex items-center gap-2 rounded-full bg-background px-7 py-4 text-base font-medium text-foreground shadow-md transition hover:bg-background/90">
          Open the tracker
          <IconArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>

    <footer className="border-t border-foreground/10">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div className="flex items-center gap-3">
          <Logo size={24} />
          <span className="text-sm font-medium">Savings Tracker</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>Local-first &middot; v0.9.2</span>
          <span>Made by Shan Padayhag</span>
        </div>
      </div>
    </footer>
  </main>;
};
