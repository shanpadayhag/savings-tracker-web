import fetchCurrentUser from '@/features/user/api/fetch-current-user';
import User from '@/features/user/entities/user';
import appDBUtil from '@/utils/app-db-util';

type ProfileInput = Pick<User, 'firstName' | 'lastName' | 'email'>;

const normalize = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const saveUserProfile = async (input: ProfileInput): Promise<User> => {
  const current = await fetchCurrentUser();
  const next: User = {
    ...current,
    firstName: normalize(input.firstName),
    lastName: normalize(input.lastName),
    email: normalize(input.email),
  };
  await appDBUtil.users.put(next);
  return next;
};

export default saveUserProfile;
