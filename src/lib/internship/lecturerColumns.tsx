import type { LecturerSupervisedStudent } from "@/services/internship.service";
import type { Column } from "@/components/internship/InternshipTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Eye, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin } from "lucide-react";

interface LecturerColumnProps {
    onViewDetail: (item: LecturerSupervisedStudent) => void;
    onApproveSeminar?: (item: LecturerSupervisedStudent) => void;
}

export const getLecturerSupervisedStudentsColumns = ({
    onViewDetail,
    onApproveSeminar,
}: LecturerColumnProps): Column<LecturerSupervisedStudent>[] => [
    {
        key: "student",
        header: "Mahasiswa",
        render: (item) => (
            <div className="flex flex-col">
                <span className="font-medium">{item.studentName}</span>
                <span className="text-xs text-muted-foreground">{item.studentNim}</span>
            </div>
        ),
        sortable: true,
    },
    {
        key: "implementation",
        header: "Tempat & Waktu KP",
        render: (item) => (
            <div className="flex flex-col gap-1 pt-1 pb-1">
                <span className="font-medium text-sm leading-tight max-w-[150px] truncate" title={item.companyName}>
                    {item.companyName}
                </span>
                <div className="text-[11px] text-muted-foreground flex flex-col">
                    <span>{item.startDate ? format(new Date(item.startDate), 'dd MMM yyyy', { locale: idLocale }) : '-'} s.d.</span>
                    <span>{item.endDate ? format(new Date(item.endDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}</span>
                </div>
            </div>
        ),
        sortable: false,
    },
     {
        key: "academicYearName",
        header: "Tahun Ajaran",
        accessor: "academicYearName",
        sortable: true,
        className: "text-center",
    },
    {
        key: "progress",
        header: "Progres Bimbingan",
        render: (item) => {
            const totalBimbingan = item.progress.submittedCount + item.progress.approvedCount;
            return (
                <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5 cursor-default group" title="Bimbingan menunggu penilaian">
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span className={item.progress.submittedCount > 0 ? "font-semibold text-orange-600" : "text-muted-foreground"}>
                            {item.progress.submittedCount} perlu dinilai
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 cursor-default group" title="Bimbingan telah disetujui">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-muted-foreground">
                            {item.progress.approvedCount} / {totalBimbingan} selesai
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        key: "seminar",
        header: "Seminar",
        render: (item) => {
            const seminar = item.seminar;
            if (!seminar) {
                return (
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                         <span className="text-xs">Belum Ada</span>
                    </div>
                );
            }

            const status = seminar.status;
            let statusConfig: { label: string; color: string; icon: React.ReactNode } = {
                label: status,
                color: 'text-muted-foreground',
                icon: <AlertCircle className="w-4 h-4" />
            };

            if (status === 'REQUESTED') {
                statusConfig = { label: 'Menunggu ACC', color: 'text-amber-600', icon: <Clock className="w-4 h-4" /> };
            } else if (status === 'APPROVED') {
                statusConfig = { label: 'Disetujui', color: 'text-green-600', icon: <CheckCircle2 className="w-4 h-4" /> };
            } else if (status === 'COMPLETED') {
                statusConfig = { label: 'Selesai', color: 'text-emerald-500', icon: <CheckCircle2 className="w-4 h-4" /> };
            } else if (status === 'REJECTED') {
                statusConfig = { label: 'Ditolak', color: 'text-red-500', icon: <XCircle className="w-4 h-4" /> };
            }

            return (
                <div className="flex flex-col items-center gap-1.5">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-center gap-1.5 cursor-help group">
                                    {statusConfig.icon}
                                    <span className={`text-xs font-medium ${statusConfig.color} underline decoration-dotted underline-offset-2 opacity-80 group-hover:opacity-100`}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-3 w-56 flex flex-col gap-2 bg-white text-popover-foreground border shadow-md">
                                <p className="text-xs font-semibold border-b pb-1">Detail Jadwal Seminar</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                        <Clock className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-medium">
                                                {format(new Date(seminar.seminarDate), 'eeee, dd MMMM yyyy', { locale: idLocale })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(seminar.startTime), 'HH:mm')} - {format(new Date(seminar.endTime), 'HH:mm')} WIB
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-medium">{seminar.room?.name || 'Ruangan belum ditentukan'}</span>
                                            {seminar.room?.location && (
                                                <span className="text-[10px] text-muted-foreground">{seminar.room.location}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {status === 'REQUESTED' && onApproveSeminar && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] px-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800"
                            onClick={(e) => {
                                e.stopPropagation();
                                onApproveSeminar(item);
                            }}
                        >
                            ACC Sekarang
                        </Button>
                    )}
                </div>
            );
        },
        className: "text-center",
        sortable: true,
    },
    {
        key: "report",
        header: "Laporan Akhir",
        render: (item) => {
            if (!item.report) {
                return (
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Belum ada</span>
                    </div>
                );
            }

            const status = item.report.status;
            let statusConfig: { label: string; color: string; icon: React.ReactNode } = {
                label: 'Belum Diunggah',
                color: 'text-muted-foreground',
                icon: <AlertCircle className="w-4 h-4" />
            };

            if (status === 'SUBMITTED') {
                statusConfig = {
                    label: 'Menunggu Verifikasi',
                    color: 'text-blue-600',
                    icon: <Clock className="w-4 h-4" />
                };
            } else if (status === 'APPROVED') {
                statusConfig = {
                    label: 'Disetujui',
                    color: 'text-green-600',
                    icon: <CheckCircle2 className="w-4 h-4" />
                };
            } else if (status === 'REVISION_NEEDED') {
                statusConfig = {
                    label: 'Perlu Revisi',
                    color: 'text-amber-600',
                    icon: <XCircle className="w-4 h-4" />
                };
            }

            return (
                <div className="flex items-center justify-center gap-1.5">
                    {statusConfig.icon}
                    <span className={`text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </div>
            );
        },
        className: "text-center",
        sortable: true,
    },
    {
        key: "finalScore",
        header: "Nilai",
        render: (item) => {
            if (item.finalScore !== null && item.finalScore !== undefined) {
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-bold">{item.finalScore.toFixed(2)}</span>
                        {item.finalGrade && (
                            <Badge variant="outline" className="text-xs h-5 bg-primary/5 text-primary border-primary/20">
                                {item.finalGrade}
                            </Badge>
                        )}
                    </div>
                );
            }
            return (
                <span className="text-xs text-muted-foreground">-</span>
            );
        },
        className: "text-center",
        sortable: true,
    },
    {
        key: "status",
        header: "Status KP",
        render: (item) => {
            let label = item.status;
            let color = 'bg-gray-100 text-gray-800 border-gray-200';

            switch (item.status) {
                case 'ONGOING':
                    label = 'Sedang Berjalan';
                    color = 'bg-blue-100 text-blue-800 border-blue-200';
                    break;
                case 'COMPLETED':
                    label = 'Selesai';
                    color = 'bg-green-100 text-green-800 border-green-200';
                    break;
                case 'REJECTED':
                    label = 'Ditolak';
                    color = 'bg-red-100 text-red-800 border-red-200';
                    break;
            }

            return (
                <Badge variant="outline" className={color}>
                    {label}
                </Badge>
            );
        },
        className: "text-center",
        sortable: true,
    },
    {
        key: "actions",
        header: "Aksi",
        render: (item) => (
            <div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 gap-2 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    title="Detail"
                    onClick={() => onViewDetail(item)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </div>
        ),
        className: "text-center",
    },
];
