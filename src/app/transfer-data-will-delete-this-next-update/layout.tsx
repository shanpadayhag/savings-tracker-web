"use client";

import { Suspense } from 'react';

export default ({ children }: { children: React.ReactNode; }) => {
  return <Suspense>{children}</Suspense>;
};
