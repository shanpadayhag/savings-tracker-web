import Currency from '@/enums/currency';
import User from '@/features/user/entities/user-old';
import { db } from '@/lib/utils';

const SINGLETON_USER_ID = 'singleton';

/**
 * Fetches the singleton user record from the database.
 * If the user does not exist, it creates a new one with default values,
 * persists it, and then returns it. This is a "get-or-create" operation.
*
 * @returns {Promise<User>} A promise that resolves to the User object.
 */
const fetchSingletonUser = async (): Promise<User> => {
  const existingUser = await db.user.get(SINGLETON_USER_ID);
  if (existingUser) return existingUser;

  const newUser: User = {
    id: SINGLETON_USER_ID,
    financialSummary: {
      totalAvailableFunds: 0,
      currency: Currency.Euro,
      lastUpdated: new Date()
    }
  };

  await db.user.add(newUser);
  return newUser;
};

export default fetchSingletonUser;
