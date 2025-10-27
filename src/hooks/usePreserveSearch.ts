import { useLocation } from "react-router-dom";

export function usePreserveSearch() {
  const { search } = useLocation();
  const withSearch = (to: string) => `${to}${search || ""}`;
  return { withSearch };
}
