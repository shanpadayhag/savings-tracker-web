// Soft-cancelled transactions are still visible in lists (with a strikethrough)
// but they no longer contribute to running totals — heatmaps, cashflow, net
// worth, top goals, etc. all need to skip them. Reversed originals stay
// counted because their offsetting reversal entry handles the ledger math.
const isCountedTransaction = (row: { cancelledAt?: Date; }): boolean =>
  !row.cancelledAt;

export default isCountedTransaction;
