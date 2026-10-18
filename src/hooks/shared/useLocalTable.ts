import { useMemo, useState } from 'react';

/**
 * Paket P8: search and pages of a `CustomTable` whose rows are all loaded at once (the proposal
 * queues are per period and small). `rows` are already filtered and sorted by the page; the
 * search matches with `matches(row, term)` (term in lower case).
 */
export function useLocalTable<T>(rows: T[], matches: (row: T, term: string) => boolean, initialPageSize = 10) {
  const [search, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(initialPageSize);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((row) => matches(row, term)) : rows;
  }, [rows, search, matches]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, lastPage);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);

  return {
    search,
    /** Spread into `CustomTable`. */
    tableProps: {
      data: pageRows,
      total: filtered.length,
      page: current,
      pageSize,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => { setPageSizeValue(size); setPage(1); },
      searchValue: search,
      onSearchChange: (value: string) => { setSearchValue(value); setPage(1); },
    },
    resetPage: () => setPage(1),
  };
}

/** Lower-case haystack of the given parts, for `matches`. */
export function haystack(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}
