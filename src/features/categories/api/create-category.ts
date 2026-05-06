import { AppError } from '@/errors/app-error';
import Category from '@/features/categories/entities/category';
import appDBUtil from '@/utils/app-db-util';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type CreateCategoryParams = {
  name: string;
  color: string;
};

const createCategory = async (params: CreateCategoryParams): Promise<Category['id']> => {
  const name = params.name.trim();

  if (!name) throw new AppError(
    "Name Your Category 🏷️",
    "Categories need a name so you can pick them later — even something simple like 'Coffee' works.");
  if (!params.color) throw new AppError(
    "Pick a Color 🎨",
    "Choose a color so this category is easy to spot in your reports.");
  if (!HEX_COLOR_PATTERN.test(params.color)) throw new AppError(
    "Color Format Off 🎨",
    "Use a hex color like #22c55e — a hash followed by six hex digits.");

  // Names are unique (case-insensitive) so the picker doesn't end up with
  // two "Groceries" entries that the user can't tell apart.
  const conflict = await appDBUtil.categories
    .where('name').equalsIgnoreCase(name)
    .first();
  if (conflict && conflict.deletedAt === 'null') throw new AppError(
    "Name Already Taken 🪞",
    `You already have a category called "${conflict.name}". Try a different name.`);

  const id = crypto.randomUUID();
  const now = new Date();
  await appDBUtil.categories.add({
    id,
    name,
    color: params.color.toLowerCase(),
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: 'null',
  });
  return id;
};

export default createCategory;
