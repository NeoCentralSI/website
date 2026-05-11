import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { CpmkTable } from '@/components/kelola/cpmk/CpmkTable';
import { CpmkFormDialog } from '@/components/kelola/cpmk/CpmkFormDialog';
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
import { LocalTabsNav } from '@/components/ui/tabs-nav';

const CPMK_SCOPE_TABS = [
    { label: 'Tugas Akhir', value: 'thesis' },
    { label: 'Metodologi Penelitian (Metopel)', value: 'research_method' },
] as const;

type CpmkScope = (typeof CPMK_SCOPE_TABS)[number]['value'];

function academicYearLabel(semester?: string, year?: string | null) {
    const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semesterLabel} ${year || ''}`.trim();
}

export function CpmkManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | undefined>(undefined);
    const [activeScope, setActiveScope] = useState<CpmkScope>('thesis');

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
        isDeleting,
    } = useCpmk(effectiveAcademicYearId);

    const scopedCpmks = useMemo(
        () => cpmks.filter((cpmk) => cpmk.type === activeScope),
        [cpmks, activeScope],
    );

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const scopeDescription =
        activeScope === 'thesis'
            ? 'CPMK untuk penilaian seminar hasil, sidang, dan konteks tugas akhir (bukan Metopel).'
            : 'CPMK untuk penilaian Metodologi Penelitian — formulir TA-03A (Pembimbing) dan TA-03B (Koordinator Metopen).';

    return (
        <div className="space-y-4">
            <LocalTabsNav
                tabs={[...CPMK_SCOPE_TABS]}
                activeTab={activeScope}
                onTabChange={(v) => setActiveScope(v as CpmkScope)}
            />
            <p className="text-xs text-muted-foreground">{scopeDescription}</p>
            <CpmkTable
                key={`${activeScope}-${effectiveAcademicYearId ?? 'none'}`}
                data={scopedCpmks}
                isLoading={isLoading}
                isFetching={isFetching}
                onDelete={remove}
                onUpdate={update}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
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
                                        {academicYearLabel(item.semester, String(item.year))}{item.isActive ? ' (Aktif)' : ''}
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
                defaultType={activeScope}
                onSubmit={(payload: CreateCpmkPayload) =>
                    create({
                        ...payload,
                        ...(effectiveAcademicYearId ? { academicYearId: effectiveAcademicYearId } : {}),
                        type: activeScope,
                    })
                }
            />
        </div>
    );
}
