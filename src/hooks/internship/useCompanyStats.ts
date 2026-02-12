import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompanyStats } from '@/services/internship.service';

export function useCompanyStats() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, isFetching, refetch, error } = useQuery({
        queryKey: ['sekdep-company-stats'],
        queryFn: getCompanyStats,
    });

    const items = data?.data || [];

    const displayItems = useMemo(() => {
        let filtered = [...items];

        if (q) {
            const lowQ = q.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.companyName.toLowerCase().includes(lowQ) ||
                    item.address.toLowerCase().includes(lowQ)
            );
        }

        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [items, q, page, pageSize]);

    const total = useMemo(() => {
        let filtered = [...items];
        if (q) {
            const lowQ = q.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.companyName.toLowerCase().includes(lowQ) ||
                    item.address.toLowerCase().includes(lowQ)
            );
        }
        return filtered.length;
    }, [items, q]);

    return {
        items,
        displayItems,
        total,
        isLoading,
        isFetching,
        q,
        setQ,
        page,
        setPage,
        pageSize,
        setPageSize,
        refetch,
        error,
    };
}
