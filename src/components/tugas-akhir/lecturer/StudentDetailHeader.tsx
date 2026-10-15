import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { formatLecturerName, toTitleCaseName } from "@/lib/text";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

export interface SummarySupervisor {
    name: string | null;
    /** Already a display label, e.g. "Pembimbing 1". */
    roleLabel: string;
}

interface StudentDetailHeaderProps {
    student: StudentDetail["student"];
    status: StudentDetail["status"];
    /** Paket E4 (5): the supervisors are part of the header. */
    supervisors?: SummarySupervisor[];
    onRefresh: () => void;
    isRefreshing: boolean;
}

/** Top of the student detail: who the student is, the thesis status, the supervisors, back and reload. */
export function StudentDetailHeader({ student, status, supervisors = [], onRefresh, isRefreshing }: StudentDetailHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
                <Button variant="outline" size="icon" asChild className="shrink-0">
                    <Link to="/tugas-akhir/bimbingan/lecturer/my-students" aria-label="Kembali ke Mahasiswa Bimbingan">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">{toTitleCaseName(student.fullName)}</h1>
                    <p className="text-muted-foreground [overflow-wrap:anywhere]">
                        {student.nim} • {student.email}
                    </p>
                    {supervisors.length > 0 && (
                        <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                            {supervisors.map((supervisor, index) => (
                                <span key={`${supervisor.roleLabel}-${supervisor.name}`}>
                                    {index > 0 && <span className="text-muted-foreground"> · </span>}
                                    <span className="text-muted-foreground">{supervisor.roleLabel}: </span>
                                    <span className="font-medium">{formatLecturerName(supervisor.name) || "-"}</span>
                                </span>
                            ))}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <RefreshButton onClick={onRefresh} isRefreshing={isRefreshing} />
                <ThesisStatusBadge status={status} className="text-sm px-3 py-1 h-9" />
            </div>
        </div>
    );
}
