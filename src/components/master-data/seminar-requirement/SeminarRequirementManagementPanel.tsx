import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeminarRequirement } from '@/hooks/master-data/useSeminarRequirement';
import { SeminarRequirementTable } from './SeminarRequirementTable';
import { SeminarRequirementFormDialog } from './SeminarRequirementFormDialog';

import { getAcademicYearsAPI, getActiveAcademicYearAPI } from '@/services/admin.service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function academicYearLabel(semester?: string, year?: string | null) {
    const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semesterLabel} ${year || ''}`.trim();
}

export function SeminarRequirementManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);

    const { data: academicYearsData } = useQuery({
        queryKey: ['academic-years'],
        queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    });

    const { data: activeAcademicYearData } = useQuery({
        queryKey: ['active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const effectiveAcademicYearId = selectedAcademicYearId || activeAcademicYearData?.academicYear?.id;

    const {
        requirements,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        remove,
        isDeleting,
        reorder,
        copyTemplate,
        isCopyingTemplate,
    } = useSeminarRequirement(effectiveAcademicYearId);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [sourceAcademicYearId, setSourceAcademicYearId] = useState<string>('');

    const availableSourceYears = (academicYearsData?.academicYears ?? [])
        .filter((item) => item.id !== effectiveAcademicYearId);

    const handleCopyTemplate = async () => {
        if (!sourceAcademicYearId || !effectiveAcademicYearId) return;
        try {
            await copyTemplate({
                sourceAcademicYearId,
                targetAcademicYearId: effectiveAcademicYearId,
            });
            setCopyDialogOpen(false);
            setSourceAcademicYearId('');
        } catch {
            // Error is handled by the hook
        }
    };

    return (
        <div className="space-y-4">
            <SeminarRequirementTable
                data={requirements}
                isLoading={isLoading}
                isFetching={isFetching}
                onDelete={remove}
                onUpdate={(id, data) => update({ id, data })}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
                onReorder={reorder}
                onCopyTemplate={() => setCopyDialogOpen(true)}
                isCopyingTemplate={isCopyingTemplate}
                isDisabled={!effectiveAcademicYearId}
                extraActions={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Tahun Ajaran</Label>
                        <Select
                            value={effectiveAcademicYearId || ""}
                            onValueChange={(value) => setSelectedAcademicYearId(value)}
                        >
                            <SelectTrigger className="w-full sm:w-[240px]">
                                <SelectValue placeholder="Pilih tahun ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYearsData?.academicYears?.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {academicYearLabel(item.semester, item.year)}{item.isActive ? ' (Aktif)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            <SeminarRequirementFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={(payload) => create({ ...payload, academicYearId: effectiveAcademicYearId! })}
            />

            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Copy Template Persyaratan Seminar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Pilih Tahun Ajaran Sumber</Label>
                        <Select value={sourceAcademicYearId} onValueChange={setSourceAcademicYearId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tahun ajaran sumber" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSourceYears.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {academicYearLabel(item.semester, item.year)}{item.isActive ? ' (Aktif)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleCopyTemplate} disabled={!sourceAcademicYearId || isCopyingTemplate}>
                            {isCopyingTemplate ? 'Menyalin...' : 'Salin Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
