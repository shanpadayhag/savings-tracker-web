"use client";

import { useEffect } from 'react';

const AuthProvider = ({ children }: { children: React.ReactNode; }) => {
  const authenticate = async () => {

  };

  useEffect(() => {
    authenticate();
  }, []);

  return children;
};

export default AuthProvider;
