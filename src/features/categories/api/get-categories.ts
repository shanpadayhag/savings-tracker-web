import Category from '@/features/categories/entities/category';
import appDBUtil from '@/utils/app-db-util';

const getCategories = async (): Promise<Category[]> => {
  const all = await appDBUtil.categories
    .filter(category => category.deletedAt === 'null')
    .toArray();

  // Sort: system "Others" pinned to the bottom, everything else alphabetical.
  // Stable order matters here — re-renders shouldn't shuffle the table when
  // the user creates/edits a row.
  return all.sort((a, b) => {
    if (a.isSystem && !b.isSystem) return 1;
    if (!a.isSystem && b.isSystem) return -1;
    return a.name.localeCompare(b.name);
  });
};

export default getCategories;
