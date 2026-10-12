import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SEARCH_DEBOUNCE_MS } from '@/hooks/useDebounce';
import { usePagedSearch } from './usePagedSearch';

describe('usePagedSearch', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('uses the shared 300 ms typing pause', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });

  it('shows what is typed at once and sends the trimmed keyword after the pause', () => {
    const { result } = renderHook(() => usePagedSearch());

    act(() => result.current.setSearch('  ilham '));
    expect(result.current.search).toBe('  ilham ');
    expect(result.current.debouncedSearch).toBe('');

    act(() => { vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1); });
    expect(result.current.debouncedSearch).toBe('');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.debouncedSearch).toBe('ilham');
    // The input keeps exactly what was typed.
    expect(result.current.search).toBe('  ilham ');
  });

  it('returns to page 1 in the same render in which the keyword changes', () => {
    const seen: Array<{ keyword: string; page: number }> = [];
    const { result } = renderHook(() => {
      const state = usePagedSearch();
      seen.push({ keyword: state.debouncedSearch, page: state.page });
      return state;
    });

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);

    act(() => result.current.setSearch('nabil'));
    // Still the old keyword: the page does not move while the user types.
    expect(result.current.page).toBe(3);

    act(() => { vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS); });
    expect(result.current.debouncedSearch).toBe('nabil');
    expect(result.current.page).toBe(1);
    // No render ever paired the new keyword with the old page.
    expect(seen.some((entry) => entry.keyword === 'nabil' && entry.page !== 1)).toBe(false);

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
  });
});
