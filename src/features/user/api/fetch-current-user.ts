import User from '@/features/user/entities/user';
import appDBUtil from '@/utils/app-db-util';

const fetchCurrentUser = async (): Promise<User> => {
  const user = await appDBUtil.users.limit(1).first();

  if (!user) return { id: crypto.randomUUID() };
  return user;
};

export default fetchCurrentUser;
