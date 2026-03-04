import type { InternshipLogbookItem } from "@/services/internship.service";
import type { Column } from "@/components/layout/CustomTable";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityColumnProps {
    onEdit: (item: InternshipLogbookItem) => void;
}

export const getLogbookColumns = ({ onEdit }: ActivityColumnProps): Column<InternshipLogbookItem>[] => [
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
            return val || <span className="text-muted-foreground italic">Belum diisi</span>;
        },
    },
    {
        key: "actions",
        header: "Aksi",
        render: (item) => (
            <div className="flex justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => onEdit(item)}
                    title="Isi Logbook"
                >
                    <Edit2 className="h-4 w-4" />
                </Button>
            </div>
        ),
        className: "text-center w-[80px]",
    },
];
