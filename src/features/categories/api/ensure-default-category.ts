// Idempotent seeder for the system "Others" category.
// Called from the categories page on mount, and from any code path that needs
// the catch-all (spend, complete-goal, transaction list rendering, picker).
// Safe to call concurrently — the lookup goes through a stable primary key so
// PK uniqueness collapses any race between two readers that both see "no
// system row" before either insert commits.
//
// Legacy installs that already have a name-keyed "Others" row keep working:
// the lookup falls back to the name match and treats the oldest row as
// canonical. Any extra duplicates produced by an earlier racy seed are
// soft-deleted on the next call so the picker self-heals.

import Category from '@/features/categories/entities/category';
import { systemCategoryColor } from '@/features/categories/data/category-color-palette';
import appDBUtil from '@/utils/app-db-util';
import isActiveRow from '@/utils/is-active-row';

export const SYSTEM_CATEGORY_ID = 'system-others';
export const SYSTEM_CATEGORY_NAME = 'Others';

const buildSeed = (): Category => {
  const now = new Date();
  return {
    id: SYSTEM_CATEGORY_ID,
    name: SYSTEM_CATEGORY_NAME,
    color: systemCategoryColor,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: 'null',
  };
};

const reviveIfDeleted = async (category: Category): Promise<Category> => {
  if (isActiveRow(category)) return category;
  await appDBUtil.categories.update(category.id, { deletedAt: 'null' });
  return { ...category, deletedAt: 'null' };
};

const findLegacySystemRows = async (): Promise<Category[]> => {
  const matches = await appDBUtil.categories
    .where('name').equalsIgnoreCase(SYSTEM_CATEGORY_NAME)
    .toArray();
  return matches.filter(category =>
    category.isSystem && isActiveRow(category));
};

const sortByCreatedAtAscending = (rows: Category[]): Category[] =>
  [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

const softDeleteDuplicates = async (duplicates: Category[]): Promise<void> => {
  const deletedAt = new Date();
  for (const duplicate of duplicates) {
    await appDBUtil.categories.update(duplicate.id, { deletedAt });
  }
};

const ensureDefaultCategory = async (): Promise<Category> => {
  const stable = await appDBUtil.categories.get(SYSTEM_CATEGORY_ID);
  if (stable) return reviveIfDeleted(stable);

  const legacy = await findLegacySystemRows();
  if (legacy.length > 0) {
    const [canonical, ...duplicates] = sortByCreatedAtAscending(legacy);
    if (duplicates.length > 0) await softDeleteDuplicates(duplicates);
    return canonical;
  }

  // No system row exists yet. Race-safe insert: if a concurrent seed wins,
  // our add throws on the duplicate primary key and we re-read.
  try {
    await appDBUtil.categories.add(buildSeed());
  } catch {
    // Lost the race; the winner's row is now committed. Fall through to read.
  }
  const winner = await appDBUtil.categories.get(SYSTEM_CATEGORY_ID);
  if (!winner) throw new Error('Failed to seed the system category.');
  return winner;
};

export default ensureDefaultCategory;
