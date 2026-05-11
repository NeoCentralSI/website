import type { InternshipLogbookItem } from "@/services/internship.service";
import type { Column } from "@/components/internship/InternshipTable";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityColumnProps {
    onEdit: (item: InternshipLogbookItem) => void;
    isLocked?: boolean;
}

export const getLogbookColumns = ({ onEdit, isLocked }: ActivityColumnProps): Column<InternshipLogbookItem>[] => [
    {
        key: "index",
        header: "Hari Ke",
        render: (_, index) => index + 1,
        className: "text-center w-[80px]",
    },
    {
        key: "activityDate",
        header: "Tanggal",
        render: (item) => {
            const date = new Date(item.activityDate);
            return format(date, "EEEE, d MMMM yyyy", { locale: id });
        },
        className: "w-[250px]",
    },
    {
        key: "activityDescription",
        header: "Aktivitas",
        render: (item) => {
            const val = item.activityDescription;
            if (val) return val;
            return isLocked ? "-" : <span className="text-muted-foreground italic">Belum diisi</span>;
        },
    },
    {
        key: "actions",
        header: "Aksi",
        render: (item) => {
            const logbookDate = new Date(item.activityDate);
            logbookDate.setHours(0, 0, 0, 0);
            
            const now = new Date();
            const startOfRange = logbookDate;
            const endOfRange = new Date(logbookDate);
            endOfRange.setDate(endOfRange.getDate() + 1);
            endOfRange.setHours(23, 59, 59, 999);
            
            const canEdit = now >= startOfRange && now <= endOfRange;
            const isFuture = now < startOfRange;
            const isExpired = now > endOfRange;

            let tooltip = "Isi Logbook";
            if (isLocked) tooltip = "Logbook sudah dikunci";
            else if (isFuture) tooltip = "Belum waktunya mengisi logbook ini";
            else if (isExpired) tooltip = "Batas waktu pengisian sudah berakhir";

            const actuallyCanEdit = canEdit && !isLocked;

            return (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${actuallyCanEdit ? 'text-muted-foreground hover:text-primary' : 'text-slate-300 cursor-not-allowed'}`}
                        onClick={() => actuallyCanEdit && onEdit(item)}
                        title={tooltip}
                        disabled={!actuallyCanEdit}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
        className: "text-center w-[80px]",
    },
];
