"use client";

// Light / dark theme toggle.
// Reads `resolvedTheme` so the icon reflects the *applied* theme even when
// the user is on `system`. Clicking flips explicitly between `light` and
// `dark`, which writes through to the underlying ThemeProvider via cookie /
// localStorage. Renders a placeholder icon-button on the very first paint so
// the header layout doesn't shift between SSR and the first client render.

import { Button } from '@/components/atoms/button';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon"
        className="size-8 text-muted-foreground"
        aria-hidden="true" tabIndex={-1}>
        <IconMoon className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDark
        ? <IconSun className="size-4" />
        : <IconMoon className="size-4" />}
    </Button>
  );
};

export default ThemeToggle;
