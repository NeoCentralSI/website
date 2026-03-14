import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Link as LinkIcon, User, Info } from 'lucide-react';

interface SeminarTabProps {
    internship: any;
    latestSeminar: any;
    endDate: Date | null;
    seminarDeadline: Date | null;
    isSeminarOverdue: boolean;
    isSeminarApproaching: boolean;
}

export const SeminarTab: React.FC<SeminarTabProps> = ({
    internship,
    latestSeminar,
    endDate,
    seminarDeadline,
    isSeminarOverdue,
    isSeminarApproaching
}) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return <Badge variant="default" className="bg-blue-500">Terjadwal</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-green-500">Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline">Menunggu Verifikasi</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {(isSeminarOverdue && (!latestSeminar || latestSeminar.status !== 'COMPLETED')) && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-4 items-start">
                    <Info className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-900">Batas Waktu Seminar Terlewati!</span>
                        <p className="text-xs text-red-700 leading-relaxed">
                            Sesuai Pedoman KP, seminar harus dilaksanakan paling lambat 2 bulan dari tanggal selesai KP ({endDate?.toLocaleDateString('id-ID')}). 
                            Karena batas waktu telah terlewati, Kerja Praktik Anda dianggap <strong>tidak dapat diselesaikan (Wajib Mengulang)</strong>. 
                            Segera hubungi Sekretaris Departemen.
                        </p>
                    </div>
                </div>
            )}

            {isSeminarApproaching && !isSeminarOverdue && (!latestSeminar || latestSeminar.status !== 'COMPLETED') && (
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 flex gap-4 items-start">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-orange-900">Batas Waktu Seminar Mendekati</span>
                        <p className="text-xs text-orange-700 leading-relaxed">
                            Batas waktu pelaksanaan seminar Anda adalah {seminarDeadline?.toLocaleDateString('id-ID')}. 
                            Pastikan bimbingan selesai dan segera daftar seminar untuk menghindari sanksi mengulang.
                        </p>
                    </div>
                </div>
            )}

            {!latestSeminar ? (
                <Card>
                    <CardHeader className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle>Belum Ada Jadwal Seminar</CardTitle>
                        <CardDescription>
                            Anda akan melihat informasi jadwal seminar di sini setelah pendaftaran diverifikasi oleh Admin.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <CardTitle>Informasi Seminar</CardTitle>
                                    <CardDescription>Detail pelaksanaan seminar Kerja Praktik Anda</CardDescription>
                                </div>
                                {getStatusBadge(latestSeminar.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tanggal & Waktu</span>
                                        <span className="text-sm font-medium">
                                            {latestSeminar.date ? new Date(latestSeminar.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Menunggu Penetapan'}
                                            {latestSeminar.time && ` • ${latestSeminar.time}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ruangan / Lokasi</span>
                                        <span className="text-sm font-medium">{latestSeminar.room?.name || 'Menunggu Penetapan'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <LinkIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Link Seminar (Opsional)</span>
                                        {latestSeminar.link ? (
                                            <a href={latestSeminar.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">
                                                {latestSeminar.link}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-medium">-</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Moderator</span>
                                        <span className="text-sm font-medium">{latestSeminar.moderatorStudent?.user?.fullName || 'Belum Ditentukan'}</span>
                                    </div>
                                </div>
                            </div>

                            {latestSeminar.status === 'SCHEDULED' && (
                                <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                                    <p className="text-sm text-blue-800">
                                        <strong>Catatan Persiapan:</strong> Mohon siapkan slide presentasi dan hadir 15 menit sebelum waktu pelaksanaan.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dosen Pembimbing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                                    {internship?.supervisor?.user?.fullName?.charAt(0) || 'D'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold">{internship?.supervisor?.user?.fullName || 'Belum Ditentukan'}</span>
                                    <span className="text-xs text-muted-foreground">Pembimbing Kerja Praktik</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
