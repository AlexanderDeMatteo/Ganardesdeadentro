export const ATHLETES_TABLE_PAGE_SIZE = 15;

export type PaginatedList<T> = {
  items: T[];
  page: number;
  pages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginateList<T>(
  items: T[],
  page: number,
  perPage = ATHLETES_TABLE_PAGE_SIZE,
): PaginatedList<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    pages,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + perPage, total),
  };
}

export function findPageForItemId<T extends { id: string }>(
  items: T[],
  id: string | null | undefined,
  perPage = ATHLETES_TABLE_PAGE_SIZE,
): number {
  if (!id) return 1;
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return 1;
  return Math.floor(index / perPage) + 1;
}
