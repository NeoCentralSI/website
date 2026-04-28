import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateId } from '@/lib/text';
import { Presentation, Calendar, Clock, MapPin, Link as LinkIcon, MessageSquare, Users, CheckCircle2, Clock3 } from 'lucide-react';
import InternshipTable from '@/components/internship/InternshipTable';

interface SekdepSeminarTabProps {
    seminars: any[];
}

export const SekdepSeminarTab: React.FC<SekdepSeminarTabProps> = ({ seminars }) => {
    if (!seminars || seminars.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-slate-50/50 rounded-xl border-2 border-dashed">
                <Presentation className="h-12 w-12 mb-2 opacity-20" />
                <p>Jadwal seminar belum tersedia</p>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent pt-0">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    Pelaksanaan Seminar
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                    Detail penjadwalan, lokasi, dan hasil seminar kerja praktik.
                </p>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
                {seminars.map((seminar) => (
                    <div key={seminar.id} className="bg-white rounded-2xl border-slate-200 border overflow-hidden">
                        <div className="bg-slate-50/50 px-6 py-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Presentation className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Seminar Kerja Praktik</h3>
                                    <p className="text-xs text-slate-500">ID Seminar: {seminar.id.split('-')[0]}</p>
                                </div>
                            </div>
                            <Badge 
                                variant={seminar.status === 'SCHEDULED' ? 'default' : 'outline'}
                                className={seminar.status === 'SCHEDULED' ? 'bg-indigo-600' : 'text-slate-500'}
                            >
                                {seminar.status === 'SCHEDULED' ? 'Terjadwal' : seminar.status}
                            </Badge>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Time and Place */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu & Tempat</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium">{seminar.seminarDate ? formatDateId(seminar.seminarDate) : "Belum ditentukan"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span className="font-medium">{seminar.time || "Belum ditentukan"}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-slate-600">
                                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-slate-800">{seminar.room?.name || "Online Meeting"}</span>
                                                {seminar.room?.location && <p className="text-xs text-slate-400 mt-0.5">{seminar.room.location}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Participant Details */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personel Seminar</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">M</div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 leading-none mb-1 uppercase">Moderator</p>
                                                <span className="font-medium text-slate-700">{seminar.moderatorName || "-"}</span>
                                            </div>
                                        </div>
                                        {seminar.linkMeeting && (
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <LinkIcon className="h-4 w-4 text-indigo-400" />
                                                <a href={seminar.linkMeeting} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium truncate max-w-[200px]">
                                                    Meeting Link
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Admin/Supervisor Notes */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catatan Tambahan</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex gap-2 text-slate-500 italic text-sm leading-relaxed">
                                            <MessageSquare className="h-4 w-4 mt-0.5 opacity-50 shrink-0" />
                                            <p>{seminar.supervisorNotes || "Tidak ada catatan tambahan"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 4. Audience Table Section */}
                        <div className="px-6 pb-6 pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-4 w-4 text-indigo-500" />
                                <h4 className="text-sm font-bold text-slate-700">Daftar Kehadiran Peserta</h4>
                            </div>
                            
                            <InternshipTable
                                hidePagination
                                columns={[
                                    {
                                        key: 'student',
                                        header: 'Mahasiswa',
                                        render: (row: any) => (
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-xs">{row.studentName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{row.nim}</span>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'registeredAt',
                                        header: 'Waktu Presensi',
                                        render: (row: any) => (
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                <Clock3 className="h-3 w-3 opacity-60" />
                                                {row.registeredAt ? formatDateId(row.registeredAt) : '-'}
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'status',
                                        header: 'Status Validasi',
                                        className: 'text-right',
                                        render: (row: any) => (
                                            <div className="flex justify-end">
                                                {row.validatedAt ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold h-5 px-1.5">
                                                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                                        Valid
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-bold h-5 px-1.5">
                                                        Belum Valid
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    }
                                ]}
                                data={(seminar.audiences || []).map((a: any) => ({
                                    studentId: a.studentId,
                                    studentName: a.student?.user?.fullName || 'Unknown',
                                    nim: a.student?.user?.identityNumber || '-',
                                    registeredAt: a.createdAt,
                                    validatedAt: a.validatedAt,
                                }))}
                                total={(seminar.audiences || []).length}
                                page={1}
                                pageSize={100}
                                onPageChange={() => {}}
                                emptyText="Belum ada peserta yang melakukan presensi"
                                className="border-none shadow-none p-0"
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};
