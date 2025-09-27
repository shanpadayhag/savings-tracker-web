import currency from 'currency.js';

const calculateAllocatedBalance = (balance: number, amount: number) => {
  return currency(balance).add(amount);
};

export default calculateAllocatedBalance;
