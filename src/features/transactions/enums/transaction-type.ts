enum TransactionType {
  Allocate = "allocate",
  Spend = "spend",
  Transfer = "transfer",
  Deallocate = "deallocate",
}

export const transactionTypeLabel = {
  [TransactionType.Allocate]: "Allocate",
  [TransactionType.Spend]: "Spend",
  [TransactionType.Transfer]: "Transfer",
  [TransactionType.Deallocate]: "Deallocate",
};

export default TransactionType;
