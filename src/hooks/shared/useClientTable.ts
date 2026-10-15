import { useMemo, useState } from 'react';

/**
 * Search and pagination done in the browser for a list the page already holds whole
 * (Paket E4 pages: Permohonan, Perubahan, Evaluasi). The page returns to 1 whenever the
 * keyword or the rows change shape; `searchOf` gives the text a row is matched on.
 */
export function useClientTable<T>(rows: T[], searchOf: (row: T) => Array<string | null | undefined>, initialPageSize = 10) {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => searchOf(row).some((value) => value?.toLowerCase().includes(keyword)));
    // searchOf is a pure accessor; the rows and the keyword decide the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  return {
    search,
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    page: currentPage,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    resetPage: () => setPage(1),
    total: filtered.length,
    pageRows,
  };
}
