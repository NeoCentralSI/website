import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toTitleCaseName } from "@/lib/text";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

interface StudentDetailHeaderProps {
    student: StudentDetail["student"];
    status: StudentDetail["status"];
    onRefresh: () => void;
    isRefreshing: boolean;
}

/** Always visible above the tabs: who the student is, the thesis status, back and reload. */
export function StudentDetailHeader({ student, status, onRefresh, isRefreshing }: StudentDetailHeaderProps) {
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
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <RefreshButton onClick={onRefresh} isRefreshing={isRefreshing} />
                <ThesisStatusBadge status={status} className="text-sm px-3 py-1 h-9" />
            </div>
        </div>
    );
}
