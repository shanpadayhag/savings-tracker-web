import Currency from '@/enums/currency';

type GoalVersion = {
  id: string;
  goalID: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | "null";
};

export default GoalVersion;
