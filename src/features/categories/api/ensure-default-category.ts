// Idempotent seeder for the system "Others" category.
// Called from the categories page on mount so the catch-all is guaranteed to
// exist on first visit. Safe to call repeatedly — it short-circuits if a
// system row already exists.
//
// The "Others" row is the implicit category for any transaction without a
// `categoryID`, which is every transaction created before this feature
// shipped, plus any future transaction the user submits without picking one.

import Category from '@/features/categories/entities/category';
import { systemCategoryColor } from '@/features/categories/data/category-color-palette';
import appDBUtil from '@/utils/app-db-util';

export const SYSTEM_CATEGORY_NAME = 'Others';

const ensureDefaultCategory = async (): Promise<Category> => {
  const existing = await appDBUtil.categories
    .where('name').equalsIgnoreCase(SYSTEM_CATEGORY_NAME)
    .first();
  if (existing) return existing;

  const now = new Date();
  const seeded: Category = {
    id: crypto.randomUUID(),
    name: SYSTEM_CATEGORY_NAME,
    color: systemCategoryColor,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: 'null',
  };

  await appDBUtil.categories.add(seeded);
  return seeded;
};

export default ensureDefaultCategory;
