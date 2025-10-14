import AuthProvider from '@/features/auth/components/atoms/AuthProvider';

export default ({ children }: { children: React.ReactNode; }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
