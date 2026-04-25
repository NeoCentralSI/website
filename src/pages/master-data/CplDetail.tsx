import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useCplStudents } from '@/hooks/master-data/useCplStudents';
import { CplStudentScoreTable } from '@/components/master-data/cpl/CplStudentScoreTable';
import { CplStudentScoreFormDialog } from '@/components/master-data/cpl/CplStudentScoreFormDialog';
import { CplStudentScoreImportDialog } from '@/components/master-data/cpl/CplStudentScoreImportDialog';
import type { CplStudentScore } from '@/services/master-data/cpl.service';

export default function CplDetailPage() {
    const { id = '' } = useParams();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [formOpen, setFormOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [editData, setEditData] = useState<CplStudentScore | null>(null);

    const {
        cpl,
        data,
        isLoading,
        isFetching,
        refetch,
        filters,
        setFilters,
        studentOptions,
        createScore,
        updateScore,
        deleteScore,
        importScores,
        exportScores,
        isCreating,
        isUpdating,
        isDeleting,
        isImporting,
        isExporting,
    } = useCplStudents(id);

    const breadcrumbs = useMemo(
        () => [
            { label: 'Master Data' },
            { label: 'CPL', href: '/kelola/cpl' },
            { label: cpl?.code ? `Detail ${cpl.code}` : 'Detail CPL' },
        ],
        [cpl?.code]
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Detail CPL');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0">
                        <Link to="/kelola/cpl">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {cpl?.code || 'Detail CPL'}
                        </h1>
                        <p className="text-muted-foreground">
                            {cpl
                                ? `${cpl.description} • Skor Minimal: ${cpl.minimalScore}`
                                : 'Memuat data CPL...'}
                        </p>
                    </div>
                </div>
            </div>

            <CplStudentScoreTable
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
                onDelete={(item) => deleteScore(item.studentId)}
                isDeleting={isDeleting}
                onImportClick={() => setImportOpen(true)}
                onExport={exportScores}
                isExporting={isExporting}
            />

            <CplStudentScoreFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editData={editData}
                onCreate={createScore}
                onUpdate={updateScore}
                isSubmitting={isCreating || isUpdating}
                studentOptions={studentOptions}
            />

            <CplStudentScoreImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                onImport={importScores}
                isImporting={isImporting}
            />
        </div>
    );
}
