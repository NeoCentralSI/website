import { useQuery } from '@tanstack/react-query';
import { getCompanyStats } from '@/services/internship';
import { useRole } from '../shared';
import { useSearchParams } from 'react-router-dom';

export function useCompanyStats() {
    const { isAdmin, isKadep } = useRole();
    const [searchParams, setSearchParams] = useSearchParams();

    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const status = searchParams.get('status') || 'all';

    const role = isAdmin() ? 'admin' : (isKadep() ? 'kadep' : 'sekdep');

    const updateParams = (updates: Record<string, string | number | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'status')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value.toString());
            }
        });
        if (updates.q !== undefined || updates.sortBy !== undefined || updates.status !== undefined) {
            newParams.set('page', '1');
        }
        setSearchParams(newParams);
    };

    const { data, isLoading, isFetching, refetch, error } = useQuery({
        queryKey: ['company-stats', role, { q, page, pageSize, sortBy, sortOrder, status }],
        queryFn: () => getCompanyStats(role, q, page, pageSize, sortBy, sortOrder, status),
        placeholderData: (previousData) => previousData,
    });

    const displayItems = data?.data || [];
    const total = data?.total || 0;

    return {
        displayItems,
        total,
        isLoading,
        isFetching,
        q,
        setQ: (q: string) => updateParams({ q }),
        page,
        setPage: (page: number) => updateParams({ page }),
        pageSize,
        setPageSize: (pageSize: number) => updateParams({ pageSize }),
        sortBy,
        sortOrder,
        setSort: (field: string, order: 'asc' | 'desc') => updateParams({ sortBy: field, sortOrder: order }),
        status,
        setStatus: (status: string) => updateParams({ status }),
        refetch,
        error,
    };
}
