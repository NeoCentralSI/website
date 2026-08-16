import { CalendarClock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OutOfPeriodBadgeProps {
    /** `false` marks a request filed in a period that is no longer operational. */
    isCurrentPeriod?: boolean;
    periodLabel?: string | null;
    className?: string;
}

/**
 * Quota summaries are always scoped to the operational period, but decision
 * queues can still hold requests filed in an earlier one. This badge makes that
 * mismatch visible so a decision is never taken against numbers that belong to
 * a different period (SIMPTA-FUN-004, SIMPTA-FUN-005).
 */
export function OutOfPeriodBadge({ isCurrentPeriod, periodLabel, className }: OutOfPeriodBadgeProps) {
    if (isCurrentPeriod !== false) return null;

    return (
        <Badge
            variant="outline"
            className={cn('gap-1 border-amber-300 bg-amber-50 text-xs text-amber-800', className)}
            title="Pengajuan ini berasal dari periode akademik yang sudah tidak berjalan. Ringkasan kuota di layar ini menghitung periode berjalan."
        >
            <CalendarClock className="h-3 w-3" />
            {periodLabel ? `Periode ${periodLabel}` : 'Periode lampau'}
        </Badge>
    );
}
