import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { useStudentCplScore } from "@/hooks/master-data/useStudentCplScore";
import { downloadStudentCplTemplate } from "@/services/master-data/student-cpl-score.service";
import { StudentCplScoreTable } from "@/components/master-data/student-cpl-score/StudentCplScoreTable";
import { StudentCplScoreFormDialog } from "@/components/master-data/student-cpl-score/StudentCplScoreFormDialog";
import { StudentCplScoreImportDialog } from "@/components/master-data/student-cpl-score/StudentCplScoreImportDialog";
import type { StudentCplScore } from "@/services/master-data/student-cpl-score.service";

export default function StudentCplScorePage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [formOpen, setFormOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editData, setEditData] = useState<StudentCplScore | null>(null);

    const breadcrumbs = useMemo(
        () => [{ label: "Kelola" }, { label: "Nilai CPL Mahasiswa" }],
        []
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle("Kelola Nilai CPL Mahasiswa");
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        data,
        isLoading,
        isFetching,
        refetch,
        filters,
        setFilters,
        createScore,
        updateScore,
        deleteScore,
        importScores,
        exportScores,
        studentOptions,
        cplOptions,
        isCreating,
        isUpdating,
        isDeleting,
        isImporting,
        isExporting,
    } = useStudentCplScore();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Kelola Nilai CPL Mahasiswa</h1>
                <p className="text-muted-foreground">
                    Manajemen nilai capaian pembelajaran lulusan (CPL) mahasiswa
                </p>
            </div>

            <StudentCplScoreTable
                data={data}
                isLoading={isLoading}
                isFetching={isFetching}
                filters={filters}
                onFiltersChange={setFilters}
                onRefresh={() => refetch()}
                onCreate={() => {
                    setEditData(null);
                    setFormOpen(true);
                }}
                onEdit={(item) => {
                    setEditData(item);
                    setFormOpen(true);
                }}
                onDelete={(item) => deleteScore(item.studentId, item.cplId)}
                isDeleting={isDeleting}
                onImportClick={() => setImportOpen(true)}
                onExport={exportScores}
                isExporting={isExporting}
            />

            <StudentCplScoreFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editData={editData}
                onCreate={createScore}
                onUpdate={updateScore}
                isSubmitting={isCreating || isUpdating}
                studentOptions={studentOptions}
                cplOptions={cplOptions}
            />

            <StudentCplScoreImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                onImport={importScores}
                isImporting={isImporting}
                onDownloadTemplate={downloadStudentCplTemplate}
            />
        </div>
    );
}
