enum TransactionType {
  Allocate = "allocate",
  Spend = "spend",
  Transfer = "transfer",
  Deallocate = "deallocate",
  Convert = "convert",
}

export const transactionTypeLabel = {
  [TransactionType.Allocate]: "Allocate",
  [TransactionType.Spend]: "Spend",
  [TransactionType.Transfer]: "Transfer",
  [TransactionType.Deallocate]: "Deallocate",
  [TransactionType.Convert]: "Convert",
};

export default TransactionType;
