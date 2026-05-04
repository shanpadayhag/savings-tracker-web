// Soft-delete a category.
// We mark `deletedAt` instead of removing the row outright so any future
// transactions that already reference this categoryID can still resolve
// the original name/color when surfacing in historical reports. Deletion
// from the user's perspective: the category disappears from pickers and
// affected transactions fall back to "Others".
//
// The system "Others" row is undeletable.

import { AppError } from '@/errors/app-error';
import Category from '@/features/categories/entities/category';
import appDBUtil from '@/utils/app-db-util';

const deleteCategory = async (id: Category['id']): Promise<void> => {
  const existing = await appDBUtil.categories.get(id);
  if (!existing) throw new AppError(
    "Category Not Found 🔍",
    "We couldn't find this category. It may have already been deleted.");
  if (existing.isSystem) throw new AppError(
    "Can't Delete 'Others' 🛡️",
    "The 'Others' category is the catch-all for uncategorized transactions and can't be removed.");

  await appDBUtil.categories.update(id, { deletedAt: new Date() });
};

export default deleteCategory;
