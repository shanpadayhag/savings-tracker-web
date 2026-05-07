import { describe, expect, it } from 'vitest';

import isActiveRow from '@/utils/is-active-row';

describe('isActiveRow', () => {
  it('treats the string sentinel "null" as active', () => {
    expect(isActiveRow({ deletedAt: 'null' })).toBe(true);
  });

  it('treats real null as active (post-JSON-roundtrip safety)', () => {
    // Some JSON serializers coerce the string "null" tombstone back to a real
    // null on import. Strict-equality checks against the literal "null"
    // would silently drop these rows after a round-trip.
    expect(isActiveRow({ deletedAt: null as unknown as string })).toBe(true);
  });

  it('treats undefined as active (legacy rows pre-tombstone)', () => {
    expect(isActiveRow({ deletedAt: undefined })).toBe(true);
    expect(isActiveRow({})).toBe(true);
  });

  it('treats a real Date as deleted', () => {
    expect(isActiveRow({ deletedAt: new Date('2026-01-01') })).toBe(false);
  });
});
