import Routes from '@/enums/routes';
import { redirect } from 'next/navigation';

export default () => {
  redirect(Routes.UserDashboard);
};
