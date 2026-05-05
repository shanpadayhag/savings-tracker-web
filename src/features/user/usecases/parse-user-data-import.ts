// Validates and hydrates a parsed JSON blob into a UserDataExport. Pure —
// performs zero DB writes — so callers can validate before destroying any
// existing data on a malformed file.

import { AppError } from '@/errors/app-error';
import UserDataExport, { USER_DATA_SCHEMA_VERSION } from '@/features/user/entities/user-data-export';

const DATE_FIELDS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hydrateDates = <T extends Record<string, unknown>>(rows: unknown): T[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(isPlainObject)
    .map(row => {
      const next: Record<string, unknown> = { ...row };
      for (const field of DATE_FIELDS) {
        const value = next[field];
        if (typeof value === 'string' && value !== 'null') {
          next[field] = new Date(value);
        }
      }
      return next as T;
    });
};

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
    wallets: hydrateDates(raw.wallets),
    goals: hydrateDates(raw.goals),
    goalVersions: hydrateDates(raw.goalVersions),
    transactions: hydrateDates(raw.transactions),
    transactionEntries: hydrateDates(raw.transactionEntries),
    // Older exports predating the categories feature won't have this key —
    // treat as empty so the import succeeds and the seeder rebuilds "Others"
    // on next read.
    categories: hydrateDates(raw.categories),
  };
};

export default parseUserDataImport;
