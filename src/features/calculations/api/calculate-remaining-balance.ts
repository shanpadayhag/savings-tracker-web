import currency from 'currency.js';

const calculateRemainingBalance = (balance: number, amount: number) => {
  return currency(balance).subtract(amount);
};

export default calculateRemainingBalance;
