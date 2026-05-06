import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import { AppError } from '@/errors/app-error';
import { SYSTEM_CATEGORY_ID, SYSTEM_CATEGORY_NAME } from '@/features/categories/api/ensure-default-category';
import updateCategory from '@/features/categories/api/update-category';
import { systemCategoryColor } from '@/features/categories/data/category-color-palette';
import appDBFake from '@/test/fakes/app-db-fake';

const seedSystemCategory = async () => {
  await appDBFake.categories.add({
    id: SYSTEM_CATEGORY_ID,
    name: SYSTEM_CATEGORY_NAME,
    color: systemCategoryColor,
    isSystem: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: 'null',
  });
};

const seedUserCategory = async (id: string, name: string, color = '#aaaaaa') => {
  await appDBFake.categories.add({
    id,
    name,
    color,
    isSystem: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: 'null',
  });
};

describe('updateCategory', () => {
  beforeEach(() => {
    appDBFake.reset();
  });

  it('updates name and color on user-created categories', async () => {
    await seedUserCategory('groceries', 'Groceries');

    await updateCategory({ id: 'groceries', name: 'Food & Drinks', color: '#ff00ff' });

    const updated = await appDBFake.categories.get('groceries');
    expect(updated?.name).toBe('Food & Drinks');
    expect(updated?.color).toBe('#ff00ff');
  });

  it('rejects renaming the system row but accepts a color change', async () => {
    await seedSystemCategory();

    await expect(updateCategory({
      id: SYSTEM_CATEGORY_ID,
      name: 'Misc',
      color: '#ff00ff',
    })).rejects.toBeInstanceOf(AppError);

    const stillNamed = await appDBFake.categories.get(SYSTEM_CATEGORY_ID);
    expect(stillNamed?.name).toBe(SYSTEM_CATEGORY_NAME);
    expect(stillNamed?.color).toBe(systemCategoryColor);

    await updateCategory({
      id: SYSTEM_CATEGORY_ID,
      name: SYSTEM_CATEGORY_NAME,
      color: '#00ff00',
    });

    const recolored = await appDBFake.categories.get(SYSTEM_CATEGORY_ID);
    expect(recolored?.name).toBe(SYSTEM_CATEGORY_NAME);
    expect(recolored?.color).toBe('#00ff00');
  });

  it('rejects when the row does not exist', async () => {
    await expect(updateCategory({
      id: 'missing',
      name: 'Anything',
      color: '#ff00ff',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects an empty name', async () => {
    await seedUserCategory('groceries', 'Groceries');

    await expect(updateCategory({
      id: 'groceries',
      name: '   ',
      color: '#ff00ff',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects an empty color', async () => {
    await seedUserCategory('groceries', 'Groceries');

    await expect(updateCategory({
      id: 'groceries',
      name: 'Groceries',
      color: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects malformed hex colors', async () => {
    await seedUserCategory('groceries', 'Groceries');

    for (const bad of ['red', '#fff', '#22c55', 'ff00ff', '#22c55ez']) {
      await expect(updateCategory({
        id: 'groceries',
        name: 'Groceries',
        color: bad,
      })).rejects.toBeInstanceOf(AppError);
    }
  });

  it('normalizes the stored hex to lowercase', async () => {
    await seedUserCategory('groceries', 'Groceries');

    await updateCategory({ id: 'groceries', name: 'Groceries', color: '#FF00FF' });

    const updated = await appDBFake.categories.get('groceries');
    expect(updated?.color).toBe('#ff00ff');
  });

  it('rejects renaming to a name already used by another active category', async () => {
    await seedUserCategory('groceries', 'Groceries');
    await seedUserCategory('food', 'Food');

    await expect(updateCategory({
      id: 'food',
      name: 'Groceries',
      color: '#aaaaaa',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('allows changing the case of the same name (no-op rename)', async () => {
    await seedUserCategory('groceries', 'groceries');

    await updateCategory({ id: 'groceries', name: 'Groceries', color: '#aaaaaa' });

    const updated = await appDBFake.categories.get('groceries');
    expect(updated?.name).toBe('Groceries');
  });
});
