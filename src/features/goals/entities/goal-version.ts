import Currency from '@/enums/currency';
import Category from '@/features/categories/entities/category';

type GoalVersion = {
  id: string;
  goalID: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  categoryID?: Category['id'];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | "null";
};

export default GoalVersion;
