import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {  Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';

export default function FieldAssessmentLogbook() {
    const { data } = useOutletContext<any>();
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const logbooks = data.internship.logbooks || [];

    const columns: Column<any>[] = [
        {
            key: 'no',
            header: 'No',
            className: 'w-16 text-center',
            render: (_, index) => (
                <span className="text-xs font-semibold text-slate-400">{index + 1}</span>
            )
        },
        {
            key: 'activityDate',
            header: 'Tanggal',
            className: 'w-48',
            render: (row) => (
                <div className="flex items-center">
                    <p className="text-xs font-semibold text-slate-700">
                        {format(new Date(row.activityDate), 'dd MMMM yyyy', { locale: localeId })}
                    </p>
                </div>
            )
        },
        {
            key: 'activityDescription',
            header: 'Deskripsi Kegiatan',
            render: (row) => (
                row.activityDescription ? (
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{row.activityDescription}"
                    </p>
                ) : (
                    <p className="text-xs font-medium text-slate-300 italic">Belum diisi</p>
                )
            )
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">Logbook Mahasiswa</h1>
                <p className="text-slate-500 text-sm font-medium">Daftar kegiatan harian mahasiswa selama masa Kerja Praktik.</p>
            </div>

            <InternshipTable
                columns={columns}
                data={logbooks}
                total={logbooks.length}
                page={1}
                pageSize={logbooks.length || 10}
                onPageChange={() => {}}
                hidePagination={true}
                emptyText="Mahasiswa belum mengisi kegiatan harian."
                className="rounded-xl border-slate-200"
            />
            
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none">Sudah selesai meninjau logbook?</p>
                        <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">
                            Langkah selanjutnya adalah memberikan penilaian kompetensi dan menandatangani Berita Acara.
                        </p>
                    </div>
                </div>
                <Button 
                    size="lg"
                    onClick={() => navigate(`/field-assessment/${token}/nilai`)}
                    className="gap-2 font-semibold h-11 px-6 shadow-sm"
                >
                    Mulai Beri Nilai
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
