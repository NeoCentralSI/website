import { useState } from 'react';

import { SEARCH_DEBOUNCE_MS, useDebounce } from '@/hooks/useDebounce';

/**
 * State of a server-side search with pagination: `search` is what the input shows,
 * `debouncedSearch` (trimmed, after the shared typing pause) is what goes to the server,
 * and the page returns to 1 in the same render in which the keyword changes, so no request
 * is made for an old page of the new keyword.
 */
export function usePagedSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [pagedKeyword, setPagedKeyword] = useState(debouncedSearch);

  if (pagedKeyword !== debouncedSearch) {
    setPagedKeyword(debouncedSearch);
    setPage(1);
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    page: pagedKeyword === debouncedSearch ? page : 1,
    setPage,
  };
}
