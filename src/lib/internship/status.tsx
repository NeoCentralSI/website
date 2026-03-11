
import { Badge } from "@/components/ui/badge";

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

export const getInternshipStatusBadge = (status: string) => {
    let variant: StatusVariant = 'outline';
    let label = status ? status.replace(/_/g, ' ') : 'PENDING';

    switch (status) {
        case 'APPROVED_PROPOSAL':
            variant = 'info';
            label = 'APPROVED (PROPOSAL)';
            break;
        case 'REJECTED_PROPOSAL':
            variant = 'destructive';
            label = 'REJECTED (PROPOSAL)';
            break;
        case 'ACCEPTED_BY_COMPANY':
            variant = 'success';
            label = 'ACCEPTED (COMPANY)';
            break;
        case 'WAITING_FOR_VERIFICATION':
            variant = 'warning';
            label = 'MENUNGGU VERIFIKASI';
            break;
        case 'PARTIALLY_ACCEPTED':
            variant = 'warning';
            label = 'PARTIALLY ACCEPTED';
            break;
        case 'REJECTED_BY_COMPANY':
            variant = 'destructive';
            label = 'REJECTED (COMPANY)';
            break;
        case 'ACCEPTED': // Member Status
            variant = 'success';
            label = 'ACCEPTED (MEMBER)';
            break;
        case 'REJECTED': // Member Status
            variant = 'destructive';
            label = 'REJECTED (MEMBER)';
            break;
        case 'PENDING':
            variant = 'warning';
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
