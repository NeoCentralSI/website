import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data dianggap stale setelah 30 detik
      gcTime: 5 * 60 * 1000, // Garbage collect setelah 5 menit
      refetchOnWindowFocus: true, // Refetch saat tab focus kembali
      refetchOnMount: true, // Refetch saat component mount jika data stale
      refetchOnReconnect: true, // Refetch saat network reconnect
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
