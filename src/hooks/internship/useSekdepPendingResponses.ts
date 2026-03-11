import { useQuery } from '@tanstack/react-query';
import { getSekdepPendingResponses } from '@/services/internship.service';
import { useSearchParams } from 'react-router-dom';

export function useSekdepPendingResponses() {
    const [searchParams, setSearchParams] = useSearchParams();

    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const academicYearId = searchParams.get('academicYearId') || '';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const updateParams = (updates: Record<string, string | number | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value.toString());
            }
        });
        if (updates.q !== undefined || updates.academicYearId !== undefined || updates.sortBy !== undefined) {
            newParams.set('page', '1');
        }
        setSearchParams(newParams);
    };

    const { data, isLoading, isFetching, refetch, error } = useQuery({
        queryKey: ['sekdep-internship-proposals-responses', { academicYearId, q, page, pageSize, sortBy, sortOrder }],
        queryFn: () => getSekdepPendingResponses(academicYearId, q, page, pageSize, sortBy, sortOrder),
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
        academicYearId,
        setAcademicYearId: (academicYearId: string) => updateParams({ academicYearId }),
        sortBy,
        sortOrder,
        setSort: (field: string, order: 'asc' | 'desc') => updateParams({ sortBy: field, sortOrder: order }),
        refetch,
        error,
    };
}
