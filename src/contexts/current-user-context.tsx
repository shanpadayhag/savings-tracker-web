"use client";

import fetchCurrentUser from '@/features/user/api/fetch-current-user';
import User from '@/features/user/entities/user';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

type CurrentUserContextValue = {
  user: User | null;
  displayName: string;
  firstName: string;
  email: string;
  initials: string;
  refresh: () => Promise<void>;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

const trimmed = (value: string | undefined): string => value?.trim() ?? '';

const computeInitials = (firstName?: string, lastName?: string, email?: string): string => {
  const parts = [trimmed(firstName), trimmed(lastName)].filter(Boolean);
  if (parts.length > 0) {
    return parts.map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('');
  }
  const cleanedEmail = trimmed(email);
  if (cleanedEmail) return cleanedEmail.charAt(0).toUpperCase();
  return 'U';
};

const computeDisplayName = (firstName?: string, lastName?: string, email?: string): string => {
  const full = [trimmed(firstName), trimmed(lastName)].filter(Boolean).join(' ');
  if (full) return full;
  const cleanedEmail = trimmed(email);
  if (cleanedEmail) return cleanedEmail;
  return 'Your Account';
};

const computeFirstName = (firstName?: string, email?: string): string => {
  const cleanedFirst = trimmed(firstName);
  if (cleanedFirst) return cleanedFirst;
  const cleanedEmail = trimmed(email);
  if (cleanedEmail.includes('@')) return cleanedEmail.split('@')[0];
  if (cleanedEmail) return cleanedEmail;
  return 'there';
};

export const CurrentUserProvider = ({ children }: { children: ReactNode; }) => {
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    const fresh = await fetchCurrentUser();
    setUser(fresh);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const displayName = computeDisplayName(user?.firstName, user?.lastName, user?.email);
  const firstName = computeFirstName(user?.firstName, user?.email);
  const email = user?.email ?? '';
  const initials = computeInitials(user?.firstName, user?.lastName, user?.email);

  return (
    <CurrentUserContext.Provider value={{ user, displayName, firstName, email, initials, refresh }}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
};
