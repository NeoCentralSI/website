import { useState, useEffect } from 'react';

/**
 * Hook to add a delay effect on first visit
 * Useful for showing loading states or animations on initial page load
 */
export function useFirstVisitDelay(delayMs: number = 1000) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    
    if (hasVisited) {
      setIsFirstVisit(false);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem('hasVisited', 'true');
      setIsLoading(false);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return { isFirstVisit, isLoading };
}
