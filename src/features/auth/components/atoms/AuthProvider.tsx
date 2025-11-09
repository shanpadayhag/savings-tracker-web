"use client";

import LoadingPage from '@/components/templates/loading-page';
import authAxios from '@/configs/axios/auth';
import Routes from '@/enums/routes';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const AuthProvider = ({ children }: { children?: React.ReactNode; }) => {
  const router = useRouter();
  const pathname = usePathname();

  const hasRun = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      try {
        await authAxios.post("/auth");

        if (!pathname.startsWith(Routes.UserPrefix))
          router.replace(Routes.UserHome);
      } catch (error) {
        router.replace(Routes.Login);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };

    authenticate();
  }, []);

  if (isLoading) return <LoadingPage />;
  return <>{children}</>;
};

export default AuthProvider;
