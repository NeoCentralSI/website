import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudentProposals } from '@/services/internship.service';

export function useStudentProposals() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [status, setStatus] = useState<string>('all');

    const { data, isLoading, isFetching, refetch, error } = useQuery({
        queryKey: ['student-internship-proposals'],
        queryFn: getStudentProposals,
    });

    const items = data?.data || [];

    const displayItems = useMemo(() => {
        let filtered = [...items];

        if (status !== 'all') {
            filtered = filtered.filter((item) => item.status === status);
        }

        if (q) {
            const lowQ = q.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.nama.toLowerCase().includes(lowQ) ||
                    item.namaCompany.toLowerCase().includes(lowQ)
            );
        }

        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [items, q, status, page, pageSize]);

    const total = useMemo(() => {
        let filtered = [...items];
        if (status !== 'all') {
            filtered = filtered.filter((item) => item.status === status);
        }
        if (q) {
            const lowQ = q.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.nama.toLowerCase().includes(lowQ) ||
                    item.namaCompany.toLowerCase().includes(lowQ)
            );
        }
        return filtered.length;
    }, [items, q, status]);

    return {
        items,
        displayItems,
        total,
        isLoading,
        isFetching,
        status,
        setStatus,
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
