import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User, Info, Edit2, AlertCircle, CheckCircle2, XCircle, Search, Users } from 'lucide-react';
import { Loading, Spinner } from '@/components/ui/spinner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerSeminar, getUpcomingSeminars, updateSeminarProposal, getEligibleStudents } from '@/services/internship';
import type { SeminarScheduleData, UpcomingSeminarItem } from '@/services/internship';
import { getRoomsAPI } from '@/services/admin.service';
import type { Room } from '@/services/admin.service';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import idLocale from '@fullcalendar/core/locales/id';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface SeminarTabProps {
    internship: any;
    latestSeminar: any;
    endDate: Date | null;
    seminarDeadline: Date | null;
    isSeminarOverdue: boolean;
    isSeminarApproaching: boolean;
}

const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Menunggu Penetapan';
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const SeminarTab: React.FC<SeminarTabProps> = ({
    internship,
    latestSeminar,
    endDate,
    seminarDeadline,
    isSeminarOverdue,
    isSeminarApproaching
}) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [moderatorSearch, setModeratorSearch] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<UpcomingSeminarItem | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [form, setForm] = useState<SeminarScheduleData>({
        seminarDate: '',
        startTime: '',
        endTime: '',
        roomId: '',
        linkMeeting: '',
        moderatorStudentId: '',
    });

    // Extract group members from internship data
    const groupMembers = useMemo(() => {
        if (!internship?.proposal?.internships) return [];
        return internship.proposal.internships.filter((m: any) => m.id !== internship.id);
    }, [internship]);

    const eligibleGroupMembers = useMemo(() => {
        return groupMembers.filter((m: any) => m.supervisorId === internship.supervisorId);
    }, [groupMembers, internship.supervisorId]);

    const ineligibleGroupMembers = useMemo(() => {
        return groupMembers.filter((m: any) => m.supervisorId !== internship.supervisorId);
    }, [groupMembers, internship.supervisorId]);

    // Fetch rooms
    const { data: roomsData } = useQuery({
        queryKey: ['rooms-list'],
        queryFn: () => getRoomsAPI({ page: 1, limit: 500, search: '' }),
    });
    const rooms: Room[] = roomsData?.data || [];

    const { data: studentsData } = useQuery({
        queryKey: ['eligible-students'],
        queryFn: getEligibleStudents,
    });
    
    const availableModerators = useMemo(() => {
        if (!studentsData?.data) return [];
        return studentsData.data.filter((s: any) =>
            s.id !== form.moderatorStudentId && 
            (s.fullName.toLowerCase().includes(moderatorSearch.toLowerCase()) ||
                s.identityNumber.includes(moderatorSearch))
        );
    }, [studentsData, form.moderatorStudentId, moderatorSearch]);

    const selectedModerator = useMemo(() => {
        if (!studentsData?.data || !form.moderatorStudentId) return null;
        return studentsData.data.find((s: any) => s.id === form.moderatorStudentId);
    }, [studentsData, form.moderatorStudentId]);

    // Fetch upcoming seminars
    const { data: upcomingSeminars = [], isLoading: isLoadingSeminars } = useQuery<UpcomingSeminarItem[]>({
        queryKey: ['upcoming-seminars'],
        queryFn: getUpcomingSeminars,
    });


    const handleDateSelect = (info: DateSelectArg) => {
        // Prevent creating new if there's already an active (Requested/Approved) seminar
        if (latestSeminar && ['REQUESTED', 'APPROVED', 'COMPLETED'].includes(latestSeminar.status)) {
            toast.error('Anda sudah memiliki jadwal seminar aktif');
            return;
        }

        const date = info.startStr.split('T')[0];
        const stTimeStr = info.startStr.includes('T') ? info.startStr.slice(11, 16) : '08:00';
        const enTimeStr = info.endStr && info.endStr.includes('T') ? info.endStr.slice(11, 16) : '10:00';

        if (!validateWeekday(date)) {
            toast.error('Seminar hanya dapat dijadwalkan pada hari kerja (Senin-Jumat).');
            return;
        }

        setIsEditing(false);
        setModeratorSearch('');
        setSelectedMemberIds([]);
        setForm({
            seminarDate: date,
            startTime: stTimeStr,
            endTime: enTimeStr,
            roomId: '',
            linkMeeting: '',
            moderatorStudentId: '',
        });
        setIsDialogOpen(true);
    };

    const validateWeekday = (dateStr: string): boolean => {
        const d = new Date(dateStr);
        const day = d.getDay();
        return day !== 0 && day !== 6;
    };

    const handleSubmit = async () => {
        if (!form.seminarDate || !form.startTime || !form.endTime || !form.roomId || !form.moderatorStudentId) {
            toast.error('Semua field wajib harus diisi.');
            return;
        }
        if (!validateWeekday(form.seminarDate)) {
            toast.error('Seminar hanya dapat dijadwalkan pada hari kerja (Senin-Jumat).');
            return;
        }
        // Standard comparison for strings "HH:mm" works fine
        if (form.startTime >= form.endTime) {
            toast.error('Waktu mulai harus lebih awal dari waktu selesai.');
            return;
        }

        // Frontend Conflict Validation - Use literal UTC comparison to match DB
        const start = new Date(`1970-01-01T${form.startTime}:00Z`);
        const end = new Date(`1970-01-01T${form.endTime}:00Z`);
        
        const conflict = upcomingSeminars.find(s => {
            const sDate = new Date(s.seminarDate).toISOString().split('T')[0];
            if (sDate !== form.seminarDate) return false;
            if (isEditing && s.id === latestSeminar?.id) return false;

            const sStart = new Date(s.startTime); // Expecting Z in ISO from backend
            const sEnd = new Date(s.endTime);
            const isOverlapping = start < sEnd && end > sStart;

            if (!isOverlapping) return false;

            // Room conflict
            if (s.room.id === form.roomId) return true;

            // Moderator conflict
            if (s.moderatorStudentId === form.moderatorStudentId) return true;

            return false;
        });

        if (conflict) {
            if (conflict.room.id === form.roomId) {
                toast.error(`Ruangan ${conflict.room.name} sudah dipesan oleh ${conflict.internship.student.user.fullName} pada waktu tersebut.`);
            } else {
                toast.error(`Mahasiswa ${conflict.moderatorStudent.user.fullName} sudah terjadwal menjadi moderator di ruangan lain pada waktu tersebut.`);
            }
            return;
        }

        try {
            setIsSubmitting(true);
            if (isEditing && latestSeminar) {
                await updateSeminarProposal(latestSeminar.id, form);
                toast.success('Jadwal seminar berhasil diperbarui.');
            } else {
                await registerSeminar({ ...form, memberInternshipIds: selectedMemberIds });
                toast.success(selectedMemberIds.length > 0 
                    ? `Pengajuan seminar untuk Anda dan ${selectedMemberIds.length} anggota kelompok berhasil dikirim.`
                    : 'Pengajuan seminar berhasil dikirim.'
                );
            }
            queryClient.invalidateQueries({ queryKey: ['student-logbooks'] });
            queryClient.invalidateQueries({ queryKey: ['upcoming-seminars'] });
            setIsEditing(false);
            setIsDialogOpen(false);
            setForm({ seminarDate: '', startTime: '', endTime: '', roomId: '', linkMeeting: '', moderatorStudentId: '' });
        } catch (error: unknown) {
            toast.error((error as Error).message || 'Gagal mengajukan seminar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-600">Disetujui</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-emerald-500">Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">Menunggu ACC Pembimbing</Badge>;
            case 'REJECTED': return <Badge variant="destructive">Ditolak</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Filter upcoming seminars by search
    const filteredSeminars = upcomingSeminars.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.internship?.student?.user?.fullName?.toLowerCase().includes(q) ||
            s.internship?.student?.user?.identityNumber?.toLowerCase().includes(q)
        );
    });

    const handleEventClick = (clickInfo: EventClickArg) => {
        const seminar = upcomingSeminars.find((s) => s.id === clickInfo.event.id);
        if (seminar) {
            setSelectedEvent(seminar);
        }
    };

    const calendarEvents = useMemo(() => {
        return filteredSeminars.map((s) => {
            const isOwnSeminar = s.internship?.id === internship?.id;
            const studentName = s.internship?.student?.user?.fullName;
            
            const sDate = new Date(s.seminarDate);
            const stTime = new Date(s.startTime); // Now includes Z
            const enTime = new Date(s.endTime);
            const datePart = sDate.toISOString().split('T')[0];

            // Use UTC methods to extract digits as-is
            const stHH = String(stTime.getUTCHours()).padStart(2, '0');
            const stMM = String(stTime.getUTCMinutes()).padStart(2, '0');
            const stSS = String(stTime.getUTCSeconds()).padStart(2, '0');

            const enHH = String(enTime.getUTCHours()).padStart(2, '0');
            const enMM = String(enTime.getUTCMinutes()).padStart(2, '0');
            const enSS = String(enTime.getUTCSeconds()).padStart(2, '0');

            let bgColor = ['APPROVED', 'COMPLETED'].includes(s.status) ? '#059669' : '#f59e0b';
            let borderColor = ['APPROVED', 'COMPLETED'].includes(s.status) ? '#059669' : '#f59e0b';

            if (isOwnSeminar) {
                bgColor = '#2563eb'; // blue-600
                borderColor = '#1d4ed8'; // blue-700
            }

            return {
                id: s.id,
                title: isOwnSeminar ? `Seminar Anda: ${studentName}` : `Seminar: ${studentName}`,
                start: `${datePart}T${stHH}:${stMM}:${stSS}`,
                end: `${datePart}T${enHH}:${enMM}:${enSS}`,
                extendedProps: { ...s, isOwnSeminar },
                backgroundColor: bgColor,
                borderColor: borderColor,
                className: isOwnSeminar ? 'cursor-pointer shadow-md opacity-100 font-semibold' : 'cursor-pointer'
            };
        });
    }, [filteredSeminars, internship?.id]);

    // ========================= RENDER =========================

    const renderFormModal = () => (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {isEditing ? 'Edit Jadwal Seminar' : 'Ajukan Jadwal Seminar'}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="seminarDate">Tanggal</Label>
                            <Input
                                id="seminarDate"
                                type="date"
                                value={form.seminarDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setForm(prev => ({ ...prev, seminarDate: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="startTime">Mulai</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={form.startTime}
                                    onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="endTime">Selesai</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={form.endTime}
                                    onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Ruangan <span className="text-red-500">*</span></Label>
                            <Select value={form.roomId} onValueChange={(v) => setForm(prev => ({ ...prev, roomId: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Ruangan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rooms.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}{r.location ? ` (${r.location})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    <div className="flex flex-col gap-2 relative">
                        <Label>Moderator (Mahasiswa) <span className="text-red-500">*</span></Label>
                        
                        {!selectedModerator ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIM atau Nama Mahasiswa..."
                                    className="pl-10 h-10"
                                    value={moderatorSearch}
                                    onChange={(e) => setModeratorSearch(e.target.value)}
                                />

                                {moderatorSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-1 z-20 border rounded-md shadow-lg bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        {availableModerators.length > 0 ? (
                                            <div className="divide-y max-h-60 overflow-y-auto">
                                                {availableModerators.slice(0, 5).map((student: any) => (
                                                    <div key={student.id}
                                                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setForm(prev => ({ ...prev, moderatorStudentId: student.id }));
                                                            setModeratorSearch("");
                                                        }}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{student.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground">{student.identityNumber}</span>
                                                        </div>
                                                        <User className="h-4 w-4 text-primary opacity-50" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-4 bg-muted/10">
                                                Mahasiswa tidak ditemukan.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-lg p-2 pl-3 group hover:border-primary/30 transition-colors h-10">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold truncate max-w-[200px]">{selectedModerator.fullName}</span>
                                    <span className="text-[10px] text-muted-foreground">{selectedModerator.identityNumber}</span>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-full transition-opacity shrink-0"
                                    onClick={() => setForm(prev => ({ ...prev, moderatorStudentId: '' }))}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="linkMeeting">Link Meeting (Opsional)</Label>
                    <Input
                        id="linkMeeting"
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={form.linkMeeting}
                        onChange={(e) => setForm(prev => ({ ...prev, linkMeeting: e.target.value }))}
                    />
                </div>

                {!isEditing && eligibleGroupMembers.length > 0 && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/20">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Sertakan Anggota Kelompok
                            </Label>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] uppercase font-bold tracking-wider"
                                type="button"
                                onClick={() => {
                                    if (selectedMemberIds.length === eligibleGroupMembers.length) {
                                        setSelectedMemberIds([]);
                                    } else {
                                        setSelectedMemberIds(eligibleGroupMembers.map((m: any) => m.id));
                                    }
                                }}
                            >
                                {selectedMemberIds.length === eligibleGroupMembers.length ? 'Batal Semua' : 'Pilih Semua'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {eligibleGroupMembers.map((member: any) => (
                                <div 
                                    key={member.id}
                                    className={`flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer ${
                                        selectedMemberIds.includes(member.id) 
                                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                                            : 'hover:bg-background border-transparent'
                                    }`}
                                    onClick={() => {
                                        setSelectedMemberIds(prev => 
                                            prev.includes(member.id) 
                                                ? prev.filter(id => id !== member.id) 
                                                : [...prev, member.id]
                                        );
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium">{member.student.user.fullName}</span>
                                        <span className="text-[10px] text-muted-foreground">{member.student.user.identityNumber}</span>
                                    </div>
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                        selectedMemberIds.includes(member.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                    }`}>
                                        {selectedMemberIds.includes(member.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {ineligibleGroupMembers.length > 0 && (
                            <div className="flex items-start gap-2 pt-2 border-t mt-1">
                                <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    {ineligibleGroupMembers.length} anggota lainnya tidak dapat disertakan karena memiliki dosen pembimbing yang berbeda.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {!isEditing && eligibleGroupMembers.length === 0 && groupMembers.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex gap-2 items-start text-amber-800">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            Anggota kelompok Anda memiliki dosen pembimbing yang berbeda, sehingga pendaftaran harus dilakukan secara mandiri.
                        </p>
                    </div>
                )}
            </div>
            <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <><Spinner className="text-current mr-2" /> Menyimpan...</> : (isEditing ? 'Simpan' : 'Tetapkan Jadwal')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);


    const renderUpcomingSeminars = () => {
        const canSelectSchedule = !latestSeminar || latestSeminar.status === 'REJECTED';
        
        return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-3">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Jadwal Seminar Mendatang
                        </CardTitle>
                        <CardDescription>Daftar seminar KP mahasiswa lain yang akan datang</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau NIM..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {canSelectSchedule && (
                            <Button onClick={() => {
                                setIsEditing(false);
                                setModeratorSearch('');
                                setForm({
                                    seminarDate: '',
                                    startTime: '',
                                    endTime: '',
                                    roomId: '',
                                    linkMeeting: '',
                                    moderatorStudentId: '',
                                });
                                setIsDialogOpen(true);
                            }} className="gap-2 shrink-0">
                                <Calendar className="h-4 w-4" />
                                Ajukan Jadwal
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingSeminars ? (
                    <div className="flex justify-center py-8">
                        <Loading size="md" text="Memuat jadwal seminar..." />
                    </div>
                ) : (
                    <div className="fullcalendar-wrapper mt-4">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            locale={idLocale}
                            height={600}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,listWeek',
                            }}
                            buttonText={{
                                today: 'hari ini',
                                month: 'bulan',
                                week: 'minggu',
                                list: 'agenda'
                            }}
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            dayMaxEvents={3}
                            firstDay={1}
                            slotMinTime="07:00:00"
                            slotMaxTime="18:00:00"
                            allDaySlot={false}
                            nowIndicator={true}
                            weekends={false}
                            selectable={canSelectSchedule}
                            selectMirror={canSelectSchedule}
                            select={handleDateSelect}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            }}
                            displayEventEnd={true}
                            eventClassNames="shadow-sm"
                        />

                        {/* Minimal Custom CSS for FullCalendar */}
                        <style>{`
        .fullcalendar-wrapper {
          --fc-border-color: var(--border);
          --fc-button-text-color: var(--foreground);
          --fc-button-bg-color: transparent;
          --fc-button-border-color: var(--border);
          --fc-button-hover-bg-color: var(--accent);
          --fc-button-hover-border-color: var(--border);
          --fc-button-active-bg-color: var(--primary);
          --fc-button-active-border-color: var(--primary);
          --fc-button-active-text-color: var(--primary-foreground);
          --fc-today-bg-color: var(--accent);
          --fc-page-bg-color: var(--background);
          --fc-neutral-bg-color: var(--secondary);
          --fc-list-event-hover-bg-color: var(--accent);
          font-family: inherit;
        }

        /* Toolbar Styling */
        .fullcalendar-wrapper .fc-header-toolbar {
          margin-bottom: 1.5rem !important;
          gap: 1rem;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: var(--foreground);
        }

        /* Button Styling */
        .fullcalendar-wrapper .fc-button {
          height: 2.25rem;
          padding: 0 1rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          text-transform: capitalize;
          border-radius: var(--radius) !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .fullcalendar-wrapper .fc-button:hover {
          background-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
          border-color: var(--border) !important;
        }

        .fullcalendar-wrapper .fc-button-active {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-color: var(--primary) !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
        }

        /* Button Group Styling */
        .fullcalendar-wrapper .fc-button-group .fc-button {
          border-radius: 0 !important;
        }
        
        .fullcalendar-wrapper .fc-button-group .fc-button:first-child {
          border-top-left-radius: var(--radius) !important;
          border-bottom-left-radius: var(--radius) !important;
        }
        
        .fullcalendar-wrapper .fc-button-group .fc-button:last-child {
          border-top-right-radius: var(--radius) !important;
          border-bottom-right-radius: var(--radius) !important;
        }

        /* Focus Ring */
        .fullcalendar-wrapper .fc-button:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
          z-index: 10;
        }

        /* Grid Header */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: var(--muted);
          padding: 0.5rem 0 !important;
        }

        .fullcalendar-wrapper .fc-col-header-cell-cushion {
          color: var(--muted-foreground);
          font-weight: 500;
          font-size: 0.875rem;
          text-transform: capitalize;
          letter-spacing: 0.025em;
        }

        /* Grid Body */
        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem 0.75rem !important;
          color: var(--foreground);
          font-size: 0.875rem;
          font-weight: 400;
        }

        .fullcalendar-wrapper .fc-day-today {
          background-color: transparent !important;
        }
        
        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-frame {
          background-color: var(--accent);
        }

        /* Events */
        .fullcalendar-wrapper .fc-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          font-weight: 500;
          font-size: 0.75rem;
        }
        .fullcalendar-wrapper .fc-highlight {
          background-color: var(--primary) !important;
          opacity: 0.15;
        }
        .fullcalendar-wrapper .fc-event-mirror {
          background-color: var(--primary) !important;
          border-color: var(--primary) !important;
          opacity: 0.8 !important;
        }
      `}</style>
                    </div>
                )}
            </CardContent>
            
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail Jadwal Seminar</DialogTitle>
                        <DialogDescription>
                            Informasi detail seminar Kerja Praktik
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{selectedEvent.internship?.student?.user?.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{selectedEvent.internship?.student?.user?.identityNumber}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{selectedEvent.room?.name}</span>
                                    <span className="text-xs text-muted-foreground">Tempat Pembangunan / Perusahaan: {selectedEvent.internship?.proposal?.targetCompany?.companyName || '-'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{formatDate(selectedEvent.seminarDate)}</span>
                                    <span className="text-xs text-muted-foreground">{formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-b pb-4">
                                <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{selectedEvent.internship?.supervisor?.user?.fullName || '-'}</span>
                                    <span className="text-xs text-muted-foreground">Dosen Pembimbing/Penguji</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Status Pendaftaran:</span>
                                {getStatusBadge(selectedEvent.status)}
                            </div>

                            {['APPROVED', 'COMPLETED'].includes(selectedEvent.status) && (
                                <Button 
                                    className="w-full gap-2" 
                                    onClick={() => navigate(`/kerja-praktik/seminar/jadwal/${selectedEvent.id}`)}
                                >
                                    <Users className="h-4 w-4" />
                                    Lihat Peserta & Absensi
                                </Button>
                            )}

                            {(() => {
                                const mySeminar = ((selectedEvent as any).groupMembers || []).find((s: any) => s.internship?.id === internship?.id) || 
                                                 (selectedEvent.internship?.id === internship?.id ? selectedEvent : null);
                                
                                if (mySeminar && mySeminar.status === 'REQUESTED') {
                                    return (
                                        <div className="flex justify-end pt-2 border-t mt-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="gap-2"
                                                onClick={() => {
                                                    const semDate = mySeminar.seminarDate ? new Date(mySeminar.seminarDate).toISOString().split('T')[0] : '';
                                                    setForm({
                                                        seminarDate: semDate,
                                                        startTime: formatTime(mySeminar.startTime),
                                                        endTime: formatTime(mySeminar.endTime),
                                                        roomId: mySeminar.room?.id || '',
                                                        linkMeeting: mySeminar.linkMeeting || '',
                                                        moderatorStudentId: mySeminar.moderatorStudentId || '',
                                                    });
                                                    setIsEditing(true);
                                                    setSelectedEvent(null);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                Edit Jadwal Saya
                                            </Button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {latestSeminar?.status === 'REJECTED' && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-4 items-start">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-900">Jadwal Sebelumnya Ditolak</span>
                        <span className="text-sm text-red-700">{latestSeminar.supervisorNotes}</span>
                    </div>
                </div>
            )}

            {/* Deadline warnings */}
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
                            Pastikan bimbingan selesai dan segera ajukan jadwal seminar untuk menghindari sanksi.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {renderFormModal()}

            {/* Section 1: My Seminar (Removed as requested by user, info is in calendar) */}
            {/* {renderSeminarDetail()} */}

            {/* Section 2: Upcoming Seminars */}
            {renderUpcomingSeminars()}
        </div>
    );
};
