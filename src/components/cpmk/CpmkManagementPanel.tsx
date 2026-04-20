import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { CpmkTable } from '@/components/cpmk/CpmkTable';
import { CpmkFormDialog } from '@/components/cpmk/CpmkFormDialog';
import type { CreateCpmkPayload } from '@/services/cpmk.service';
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

export function CpmkManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);

    const { data: academicYearsData } = useQuery({
        queryKey: ['cpmk-academic-years'],
        queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    });

    const { data: activeAcademicYearData } = useQuery({
        queryKey: ['cpmk-active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const effectiveAcademicYearId = selectedAcademicYearId || activeAcademicYearData?.academicYear?.id;

    const {
        cpmks,
        isLoading,
        isFetching,
        refetch,
        create,
        update,
        remove,
        copyTemplate,
        isDeleting,
        isCopyingTemplate,
    } = useCpmk(effectiveAcademicYearId);

    // Filter to only show thesis-type CPMKs
    const thesisCpmks = cpmks.filter((cpmk) => cpmk.type === 'thesis');

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [copyDialogOpen, setCopyDialogOpen] = useState(false);
    const [sourceAcademicYearId, setSourceAcademicYearId] = useState<string>('');

    const availableSourceYears = (academicYearsData?.academicYears ?? [])
        .filter((item) => item.id !== effectiveAcademicYearId);

    const handleCopyTemplate = async () => {
        if (!sourceAcademicYearId || !effectiveAcademicYearId) return;
        await copyTemplate({
            sourceAcademicYearId,
            targetAcademicYearId: effectiveAcademicYearId,
        });
        setCopyDialogOpen(false);
        setSourceAcademicYearId('');
    };

    return (
        <div className="space-y-4">
            <CpmkTable
                data={thesisCpmks}
                isLoading={isLoading}
                isFetching={isFetching}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
                onCopyTemplate={() => setCopyDialogOpen(true)}
                isCopyingTemplate={isCopyingTemplate}
                extraActions={
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Tahun Ajaran</Label>
                        <Select
                            value={effectiveAcademicYearId}
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

            <CpmkFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={(payload: CreateCpmkPayload) => create({ ...payload, academicYearId: effectiveAcademicYearId })}
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
                            Salin Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
