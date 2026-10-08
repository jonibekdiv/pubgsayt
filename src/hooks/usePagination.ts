import { useMemo, useState, useEffect } from 'react';

export function usePagination<T>(items: T[], perPage = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  // Reset to page 1 when items change significantly
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [items.length, totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return {
    page,
    setPage,
    totalPages,
    total: items.length,
    perPage,
    pageItems,
  };
}