import { AppError } from '@/errors/app-error';
import Category from '@/features/categories/entities/category';
import appDBUtil from '@/utils/app-db-util';

type UpdateCategoryParams = {
  id: Category['id'];
  name: string;
  color: string;
};

const updateCategory = async (params: UpdateCategoryParams): Promise<void> => {
  const existing = await appDBUtil.categories.get(params.id);
  if (!existing) throw new AppError(
    "Category Not Found 🔍",
    "We couldn't find this category. It may have been deleted — try refreshing.");
  if (existing.isSystem) throw new AppError(
    "System Category 🛡️",
    "The 'Others' category is built in and can't be edited. Create a new category instead.");

  const name = params.name.trim();
  if (!name) throw new AppError(
    "Name Your Category 🏷️",
    "Categories need a name so you can pick them later.");
  if (!params.color) throw new AppError(
    "Pick a Color 🎨",
    "Choose a color so this category is easy to spot in your reports.");

  // Reject duplicate names — but allow renaming to a value that's the same
  // ignoring case (e.g., "groceries" → "Groceries") since that resolves to
  // the same row.
  const conflict = await appDBUtil.categories
    .where('name').equalsIgnoreCase(name)
    .first();
  if (conflict && conflict.id !== params.id && conflict.deletedAt === 'null') throw new AppError(
    "Name Already Taken 🪞",
    `You already have a category called "${conflict.name}". Try a different name.`);

  await appDBUtil.categories.update(params.id, {
    name,
    color: params.color,
  });
};

export default updateCategory;
