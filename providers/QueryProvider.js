import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with offline-first configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 1 hour
      staleTime: 60 * 60 * 1000,
      // Keep data in cache for 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      // Don't retry failed requests automatically
      retry: false,
      // Don't refetch on window focus
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
      // Keep showing cached data even if it's stale
      keepPreviousData: true,
      // Don't automatically refetch when component mounts
      refetchOnMount: false,
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export { queryClient };
