// Validates and hydrates a parsed JSON blob into a UserDataExport. Pure —
// performs zero DB writes — so callers can validate before destroying any
// existing data on a malformed file.

import { AppError } from '@/errors/app-error';
import UserDataExport, { USER_DATA_SCHEMA_VERSION } from '@/features/user/entities/user-data-export';

const DATE_FIELDS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const hydrateRow = (row: Record<string, unknown>): Record<string, unknown> => {
  const next: Record<string, unknown> = { ...row };
  for (const field of DATE_FIELDS) {
    const value = next[field];
    if (typeof value === 'string' && value !== 'null') {
      next[field] = new Date(value);
    }
  }
  return next;
};

const hydrateRows = <T extends Record<string, unknown>>(
  rows: unknown,
  rowIsValid: (row: Record<string, unknown>) => boolean,
): T[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(isPlainObject)
    .filter(rowIsValid)
    .map(hydrateRow) as T[];
};

// Per-table row validators. Anything that fails — missing ID, NaN amount,
// non-string fields where strings are required — is dropped from the import
// rather than allowed to corrupt the appDB and propagate into computed
// balances. Enum values aren't checked here; downstream computes filter on
// matchers and a stray value just becomes invisible.
const isValidRowWithID = (row: Record<string, unknown>): boolean =>
  isNonEmptyString(row.id);

const isValidGoalVersionRow = (row: Record<string, unknown>): boolean =>
  isNonEmptyString(row.id)
  && isNonEmptyString(row.goalID)
  && isFiniteNumber(row.targetAmount);

const isValidTransactionEntryRow = (row: Record<string, unknown>): boolean =>
  isNonEmptyString(row.id)
  && isNonEmptyString(row.transactionID)
  && isFiniteNumber(row.amount);

const parseUserDataImport = (raw: unknown): UserDataExport => {
  if (!isPlainObject(raw)) throw new AppError(
    "Can't Read That File 📄",
    "The file isn't a valid savings tracker export. Try exporting again from a working install.");

  if (!isPlainObject(raw.user)) throw new AppError(
    "Missing User Section 👤",
    "The file is missing the user section. Make sure you're importing a full export, not a partial one.");

  const schemaVersion = typeof raw.schemaVersion === 'number'
    ? raw.schemaVersion
    : USER_DATA_SCHEMA_VERSION;
  if (schemaVersion > USER_DATA_SCHEMA_VERSION) throw new AppError(
    "Newer File Format 🔮",
    `This export uses schema version ${schemaVersion}, but this app only knows up to ${USER_DATA_SCHEMA_VERSION}. Update the app and try again.`);

  return {
    schemaVersion,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    user: raw.user as UserDataExport['user'],
    wallets: hydrateRows(raw.wallets, isValidRowWithID),
    goals: hydrateRows(raw.goals, isValidRowWithID),
    goalVersions: hydrateRows(raw.goalVersions, isValidGoalVersionRow),
    transactions: hydrateRows(raw.transactions, isValidRowWithID),
    transactionEntries: hydrateRows(raw.transactionEntries, isValidTransactionEntryRow),
    // Older exports predating the categories feature won't have this key —
    // treat as empty so the import succeeds and the seeder rebuilds "Others"
    // on next read.
    categories: hydrateRows(raw.categories, isValidRowWithID),
  };
};

export default parseUserDataImport;
