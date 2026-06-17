import { describe, expect, it } from 'vitest';
import {
  ATHLETES_TABLE_PAGE_SIZE,
  findPageForItemId,
  paginateList,
} from '@/lib/admin-v2/paginate-list';

const items = Array.from({ length: 32 }, (_, index) => index + 1);
const athletes = items.map((id) => ({ id: String(id) }));

describe('paginateList', () => {
  it('slices items for the requested page', () => {
    const result = paginateList(items, 2, ATHLETES_TABLE_PAGE_SIZE);
    expect(result.items).toHaveLength(ATHLETES_TABLE_PAGE_SIZE);
    expect(result.items[0]).toBe(16);
    expect(result.page).toBe(2);
    expect(result.pages).toBe(3);
    expect(result.rangeStart).toBe(16);
    expect(result.rangeEnd).toBe(30);
  });

  it('clamps page below 1 and above last page', () => {
    expect(paginateList(items, 0).page).toBe(1);
    expect(paginateList(items, 99).page).toBe(3);
  });

  it('returns empty result metadata for empty lists', () => {
    const result = paginateList([], 1);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.pages).toBe(1);
  });
});

describe('findPageForItemId', () => {
  it('returns the page containing the item index', () => {
    expect(findPageForItemId(athletes, '1')).toBe(1);
    expect(findPageForItemId(athletes, '16')).toBe(2);
    expect(findPageForItemId(athletes, '31')).toBe(3);
  });

  it('returns page 1 when id is missing or not found', () => {
    expect(findPageForItemId(athletes, null)).toBe(1);
    expect(findPageForItemId(athletes, 'missing')).toBe(1);
  });
});
