import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import { AppError } from '@/errors/app-error';
import createCategory from '@/features/categories/api/create-category';
import appDBFake from '@/test/fakes/app-db-fake';

describe('createCategory', () => {
  beforeEach(() => {
    appDBFake.reset();
  });

  it('creates a row with the trimmed name and the lowercased color', async () => {
    const id = await createCategory({ name: '  Groceries  ', color: '#22C55E' });

    const stored = await appDBFake.categories.get(id);
    expect(stored?.name).toBe('Groceries');
    expect(stored?.color).toBe('#22c55e');
    expect(stored?.isSystem).toBe(false);
    expect(stored?.deletedAt).toBe('null');
  });

  it('rejects an empty name', async () => {
    await expect(createCategory({ name: '   ', color: '#22c55e' }))
      .rejects.toBeInstanceOf(AppError);
  });

  it('rejects an empty color', async () => {
    await expect(createCategory({ name: 'Groceries', color: '' }))
      .rejects.toBeInstanceOf(AppError);
  });

  it('rejects malformed hex colors', async () => {
    for (const bad of ['red', '#fff', '#22c55', '22c55e', '#22c55ez']) {
      await expect(createCategory({ name: `Test-${bad}`, color: bad }))
        .rejects.toBeInstanceOf(AppError);
    }
  });

  it('rejects a duplicate name (case-insensitive)', async () => {
    await createCategory({ name: 'Groceries', color: '#22c55e' });

    await expect(createCategory({ name: 'groceries', color: '#ef4444' }))
      .rejects.toBeInstanceOf(AppError);
  });
});
