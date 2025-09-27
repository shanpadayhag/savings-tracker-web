/**
 * Currently there will be 1 whole total available funds. But when implementing
 * the actual database, please note that there will be an "acount" that will
 * act as a virtual wallet
 */
type User = {
  id: "singleton";
  financialSummary: {
    totalAvailableFunds: number;
    currency: string;
    lastUpdated: Date;
  };
};

export default User;
