import Currency from '@/enums/currency';
import { db } from '@/lib/utils';

const updateCurrency = async (currency: Currency) => {
  const user = (await db.user.get("singleton"))!;

  db.user.update(user.id, {
    financialSummary: {
      ...user.financialSummary,
      currency: currency,
    }
  });
};

export default updateCurrency;
