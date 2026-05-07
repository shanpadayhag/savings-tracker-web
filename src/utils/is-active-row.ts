// Soft-delete tombstone semantics.
//
// Rows in this app use a `deletedAt` field that doubles as a soft-delete
// tombstone:
//   - The string sentinel `"null"` means "not deleted." (Dexie's `creating`
//     hook auto-fills this for new rows; most writers also pass it
//     explicitly.)
//   - A real `Date` means "deleted at that moment."
//   - Real `null` and `undefined` arise from JSON serialization round-trips
//     (e.g., imports) where `"null"` may have been coerced to actual null,
//     or where the field was omitted entirely.
//
// Always treat all three "no Date here" forms as active — string `"null"`,
// real `null`, or `undefined`. Strict-equality checks against the literal
// `"null"` would silently hide perfectly valid rows after an import or any
// serialization round-trip, masking data the user thinks they own.

const isActiveRow = (row: { deletedAt?: unknown; }): boolean =>
  row.deletedAt === 'null' || row.deletedAt === null || row.deletedAt === undefined;

export default isActiveRow;
