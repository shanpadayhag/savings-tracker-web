import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import ensureDefaultCategory, { SYSTEM_CATEGORY_ID, SYSTEM_CATEGORY_NAME } from '@/features/categories/api/ensure-default-category';
import { systemCategoryColor } from '@/features/categories/data/category-color-palette';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

describe('ensureDefaultCategory', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('creates the system row with the stable ID on first call', async () => {
    const seeded = await ensureDefaultCategory();

    expect(seeded.id).toBe(SYSTEM_CATEGORY_ID);
    expect(seeded.name).toBe(SYSTEM_CATEGORY_NAME);
    expect(seeded.isSystem).toBe(true);
    expect(seeded.color).toBe(systemCategoryColor);
    expect(seeded.deletedAt).toBe('null');
  });

  it('returns the same row on repeated calls without creating duplicates', async () => {
    const first = await ensureDefaultCategory();
    const second = await ensureDefaultCategory();
    const third = await ensureDefaultCategory();

    expect(first.id).toBe(second.id);
    expect(second.id).toBe(third.id);
    expect(appDBFake.categories.list()).toHaveLength(1);
  });

  it('handles concurrent first-time seeds without creating duplicates', async () => {
    const [a, b, c] = await Promise.all([
      ensureDefaultCategory(),
      ensureDefaultCategory(),
      ensureDefaultCategory(),
    ]);

    expect(a.id).toBe(SYSTEM_CATEGORY_ID);
    expect(b.id).toBe(SYSTEM_CATEGORY_ID);
    expect(c.id).toBe(SYSTEM_CATEGORY_ID);
    expect(appDBFake.categories.list()).toHaveLength(1);
  });

  it('reuses a legacy row that was seeded with a random ID under the old code', async () => {
    const legacy = {
      id: 'legacy-uuid',
      name: SYSTEM_CATEGORY_NAME,
      color: '#abcdef',
      isSystem: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: 'null' as const,
    };
    await appDBFake.categories.add(legacy);

    const found = await ensureDefaultCategory();

    expect(found.id).toBe('legacy-uuid');
    expect(appDBFake.categories.list()).toHaveLength(1);
  });

  it('soft-deletes legacy duplicates and keeps the oldest one', async () => {
    await appDBFake.categories.add({
      id: 'legacy-newer',
      name: SYSTEM_CATEGORY_NAME,
      color: '#abcdef',
      isSystem: true,
      createdAt: new Date('2026-04-10'),
      updatedAt: new Date('2026-04-10'),
      deletedAt: 'null',
    });
    await appDBFake.categories.add({
      id: 'legacy-oldest',
      name: SYSTEM_CATEGORY_NAME,
      color: '#123456',
      isSystem: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: 'null',
    });

    const canonical = await ensureDefaultCategory();

    expect(canonical.id).toBe('legacy-oldest');
    const newer = await appDBFake.categories.get('legacy-newer');
    expect(newer?.deletedAt).not.toBe('null');
  });

  it('revives a soft-deleted system row on read', async () => {
    await appDBFake.categories.add({
      id: SYSTEM_CATEGORY_ID,
      name: SYSTEM_CATEGORY_NAME,
      color: systemCategoryColor,
      isSystem: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: new Date('2026-02-01'),
    });

    const revived = await ensureDefaultCategory();

    expect(revived.deletedAt).toBe('null');
    const stored = await appDBFake.categories.get(SYSTEM_CATEGORY_ID);
    expect(stored?.deletedAt).toBe('null');
  });
});
