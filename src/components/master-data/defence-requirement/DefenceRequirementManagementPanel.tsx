import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDefenceRequirement } from '@/hooks/master-data/useDefenceRequirement';
import { DefenceRequirementTable } from './DefenceRequirementTable';
import { DefenceRequirementFormDialog } from './DefenceRequirementFormDialog';

import { getAcademicYearsAPI, getActiveAcademicYearAPI } from '@/services/admin.service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function academicYearLabel(semester?: string, year?: string | null) {
    const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semesterLabel} ${year || ''}`.trim();
}

export function DefenceRequirementManagementPanel() {
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
    } = useDefenceRequirement(effectiveAcademicYearId);

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <div className="space-y-4">
            <DefenceRequirementTable
                data={requirements}
                isLoading={isLoading}
                isFetching={isFetching}
                onDelete={remove}
                onUpdate={(id, data) => update({ id, data })}
                onCreate={() => setCreateDialogOpen(true)}
                onRefresh={() => refetch()}
                isDeleting={isDeleting}
                onReorder={reorder}
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

            <DefenceRequirementFormDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={(payload: any) => create({ ...payload, academicYearId: effectiveAcademicYearId! })}
            />
        </div>
    );
}
