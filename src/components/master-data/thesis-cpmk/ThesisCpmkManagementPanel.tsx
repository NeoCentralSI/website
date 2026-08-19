import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useThesisCpmk } from '@/hooks/master-data/useThesisCpmk';
import { ThesisCpmkTable } from '@/components/master-data/thesis-cpmk/ThesisCpmkTable';
import { ThesisCpmkFormDialog } from '@/components/master-data/thesis-cpmk/ThesisCpmkFormDialog';
import type { ThesisCpmkFormValues } from '@/services/master-data/thesis-cpmk.service';
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

function academicYearLabel(semester?: string, year?: string | number | null) {
    const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semesterLabel} ${year || ''}`.trim();
}

export function ThesisCpmkManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);

    const { data: academicYearsData, isLoading: isAcademicYearsLoading } = useQuery({
        queryKey: ['cpmk-academic-years'],
        queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    });

    const { data: activeAcademicYearData, isLoading: isActiveAcademicYearLoading } = useQuery({
        queryKey: ['cpmk-active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const effectiveAcademicYearId = selectedAcademicYearId || activeAcademicYearData?.academicYear?.id;

    const {
        thesisCpmks,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        remove,
        isDeleting,
        copyTemplate,
        isCopyingTemplate,
    } = useThesisCpmk(effectiveAcademicYearId);

    // Filter to only show thesis-type CPMKs
    const thesisCpmksData = thesisCpmks;

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [sourceAcademicYearId, setSourceAcademicYearId] = useState<string>('');
    const canManage = Boolean(effectiveAcademicYearId);

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

    const handleCreate = (payload: ThesisCpmkFormValues) => {
        if (!effectiveAcademicYearId) {
            return Promise.reject(new Error('Pilih tahun ajaran terlebih dahulu'));
        }
        return create({ ...payload, academicYearId: effectiveAcademicYearId });
    };

    return (
        <div className="space-y-4">
            <ThesisCpmkTable
                data={thesisCpmksData}
                isLoading={isLoading || isAcademicYearsLoading || isActiveAcademicYearLoading}
                isFetching={isFetching}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
                onCopyTemplate={() => setCopyDialogOpen(true)}
                isCopyingTemplate={isCopyingTemplate}
                actionsDisabled={!canManage}
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

            <ThesisCpmkFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={handleCreate}
            />

            <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Copy Template CPMK</DialogTitle>
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
