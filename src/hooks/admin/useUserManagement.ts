import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUsersAPI } from '@/services/admin.service';

interface UseUserManagementOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export const useUserManagement = (options: UseUserManagementOptions = {}) => {
  const { initialPage = 1, initialPageSize = 10 } = options;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchValue, setSearchValue] = useState('');
  const [identityTypeFilter, setIdentityTypeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Convert statusFilter to boolean for API
  const isVerifiedFilter = statusFilter === 'verified' 
    ? true 
    : statusFilter === 'unverified' 
    ? false 
    : undefined;

  // Use TanStack Query for server state
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', { 
      page, 
      pageSize, 
      search: searchValue,
      identityType: identityTypeFilter,
      role: roleFilter,
      isVerified: isVerifiedFilter
    }],
    queryFn: () => getUsersAPI({ 
      page, 
      pageSize, 
      search: searchValue,
      identityType: identityTypeFilter || undefined,
      role: roleFilter || undefined,
      isVerified: isVerifiedFilter
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data user');
    }
  }, [error]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchValue, identityTypeFilter, roleFilter, statusFilter]);

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return {
    // Data
    users: data?.users || [],
    total: data?.meta?.total || 0,
    isLoading,
    error,

    // Pagination
    page,
    pageSize,
    setPage,
    setPageSize,

    // Filters
    searchValue,
    setSearchValue,
    identityTypeFilter,
    setIdentityTypeFilter,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,

    // Helpers
    invalidateUsers,
  };
};
