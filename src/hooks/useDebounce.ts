import { useState, useEffect } from 'react';

/** Typing pause before a search goes to the server; the same on every server-side search. */
export const SEARCH_DEBOUNCE_MS = 300;

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
