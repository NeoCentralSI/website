
import { Badge } from "@/components/ui/badge";

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

export const getInternshipStatusBadge = (status: string) => {
    let variant: StatusVariant = 'outline';
    let label = status ? status.replace(/_/g, ' ') : 'PENDING';

    switch (status) {
        case 'APPROVED_BY_SEKDEP':
            variant = 'info';
            label = 'APPROVED (SEKDEP)';
            break;
        case 'REJECTED_BY_SEKDEP':
            variant = 'destructive';
            label = 'REJECTED (SEKDEP)';
            break;
        case 'ACCEPTED_BY_COMPANY':
            variant = 'success';
            label = 'ACCEPTED (COMPANY)';
            break;
        case 'PARTIALLY_ACCEPTED':
            variant = 'warning';
            label = 'PARTIALLY ACCEPTED';
            break;
        case 'REJECTED_BY_COMPANY':
            variant = 'destructive'; // Or warning-destructive hybrid? Red is good for rejection.
            label = 'REJECTED (COMPANY)';
            break;
        case 'CANCELLED':
            variant = 'secondary';
            label = 'CANCELLED';
            break;
        case 'ACCEPTED': // Member Status
            variant = 'success';
            label = 'ACCEPTED';
            break;
        case 'REJECTED': // Member Status
            variant = 'destructive';
            label = 'REJECTED';
            break;
        case 'PENDING':
            variant = 'secondary';
            label = 'PENDING';
            break;
        default:
            variant = 'outline';
            break;
    }

    return (
        <div className="flex items-center justify-center">
            <Badge variant={variant} className="whitespace-nowrap text-[10px] px-2 py-0">
                {label}
            </Badge>
        </div>
    );
};
