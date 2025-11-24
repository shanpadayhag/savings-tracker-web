import Currency from '@/enums/currency';

type Wallet = {
  id: string;
  name: string;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default Wallet;
