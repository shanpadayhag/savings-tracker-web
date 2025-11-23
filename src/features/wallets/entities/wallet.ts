import Currency from '@/enums/currency';
import User from '@/features/user/entities/user-old';

type Wallet = {
  id: string;
  userID: User['id'];
  name: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default Wallet;
