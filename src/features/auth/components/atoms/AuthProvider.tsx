"use client";

import LoadingPage from '@/components/templates/loading-page';
import authAxios from '@/configs/axios/auth';
import Routes from '@/enums/routes';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authenticate = async () => {
      try {
        await authAxios.post("/auth");

        if (!pathname.startsWith(Routes.UserPrefix))
          router.replace(Routes.UserDashboard);
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
