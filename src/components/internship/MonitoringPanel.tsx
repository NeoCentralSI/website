import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Calendar as CalendarIcon,
    ArrowRight
} from 'lucide-react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import { useMonitoring } from '@/hooks/internship/useMonitoring';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { InternshipTable, type Column } from '@/components/internship/InternshipTable';

export const MonitoringPanel: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [academicYearId, setAcademicYearId] = useState<string>('all');
    
    const { academicYears } = useAcademicYears({ pageSize: 50 });
    const { stats, list, isLoading } = useMonitoring(academicYearId);

    useEffect(() => {
        if (academicYearId === 'all' && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) {
                setAcademicYearId(active.id);
            }
        }
    }, [academicYears, academicYearId]);

    const filteredList = list?.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.nim.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const statsCards = [
        { title: "Mahasiswa Ongoing", value: stats?.summary.totalOngoing || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Menunggu Verifikasi", value: stats?.summary.waitingVerification || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Melewati Deadline (2 Bln)", value: stats?.summary.overdue || 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        { title: "Selesai (Semester Ini)", value: stats?.summary.completed || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    ];

    const deadlinePieData = list ? [
        { name: 'Aman (< 45 Hari)', value: list.filter(s => s.status === 'Aman').length, color: '#10b981' },
        { name: 'Peringatan (45-60 Hari)', value: list.filter(s => s.status === 'Peringatan').length, color: '#f59e0b' },
        { name: 'Terlambat (> 60 Hari)', value: list.filter(s => s.status === 'Terlambat').length, color: '#ef4444' },
    ] : [];

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'student',
            header: 'Mahasiswa',
            render: (student) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{student.name}</span>
                    <span className="text-xs text-slate-500">{student.nim}</span>
                </div>
            )
        },
        {
            key: 'supervisor',
            header: 'Pembimbing',
            accessor: 'supervisor',
            className: 'text-sm text-slate-600'
        },
        {
            key: 'endDate',
            header: 'Tgl Selesai KP',
            render: (student) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="text-sm">
                        {student.endDate ? new Date(student.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                </div>
            )
        },
        {
            key: 'deadline',
            header: 'Status Deadline',
            render: (student) => (
                <Badge 
                    variant="outline" 
                    className={`w-fit font-medium shadow-none ${
                        student.status === 'Terlambat' ? 'bg-red-50 text-red-700 border-red-200' : 
                        student.status === 'Peringatan' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-green-50 text-green-700 border-green-200'
                    }`}
                >
                    {student.status === 'Terlambat' ? `Lewat ${student.daysPast - 60} Hari` : 
                     student.status === 'Peringatan' ? `Sisa ${60 - student.daysPast} Hari` : 
                     `Sisa ${60 - student.daysPast} Hari`}
                </Badge>
            )
        },
        {
            key: 'progress',
            header: 'Progres Kelengkapan',
            render: (student) => (
                <div className="flex items-center gap-1.5">
                    <ProgressIndicator active={student.progress.field} label="Lap" />
                    <ProgressIndicator active={student.progress.lecturer} label="Dos" />
                    <ProgressIndicator active={student.progress.seminar} label="Sem" />
                    <ProgressIndicator active={student.progress.report} label="Fix" />
                </div>
            )
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (student) => (
                <button 
                    onClick={() => navigate(`/kelola/kerja-praktik/mahasiswa/${student.id}`)}
                    className="text-primary hover:text-primary/80 font-medium text-sm inline-flex items-center gap-1"
                >
                    Detail <ArrowRight className="h-3.5 w-3.5" />
                </button>
            )
        }
    ], [navigate]);

    if (isLoading && !stats) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <Skeleton className="col-span-2 h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            {/* Top Filter & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">Monitoring Progress Kerja Praktik</h2>
                    <p className="text-sm text-slate-500 text-pretty">Pantau kepatuhan deadline 2 bulan pasca-KP dan statistik penyelesaian mahasiswa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={academicYearId} onValueChange={setAcademicYearId}>
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                            {academicYears.map((ay) => (
                                <SelectItem key={ay.id} value={ay.id}>
                                    <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                        {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-none overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-200 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Distribusi Status Mahasiswa</CardTitle>
                        <CardDescription>Jumlah mahasiswa di setiap tahapan siklus KP</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.distribution || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#64748b', fontSize: 12}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#64748b', fontSize: 12}}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Status Deadline 2 Bulan</CardTitle>
                        <CardDescription>Kepatuhan penyelesaian pasca-KP</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deadlinePieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {deadlinePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {deadlinePieData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                                        <span className="text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-900">{item.value} Mahasiswa</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table Section */}
            <div className="space-y-4">
                <div className="flex flex-col gap-1 px-1">
                    <h3 className="text-base font-semibold text-slate-800">Daftar Pantauan Deadline Mahasiswa</h3>
                    <p className="text-sm text-slate-500">Detail progres mahasiswa yang telah menyelesaikan masa KP di lapangan (Belum Lulus)</p>
                </div>
                
                <InternshipTable
                    columns={columns}
                    data={filteredList}
                    loading={isLoading}
                    total={filteredList.length}
                    page={1}
                    pageSize={10}
                    onPageChange={() => {}}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    className="border-slate-200 shadow-none overflow-hidden"
                    emptyText="Tidak ada data mahasiswa yang memenuhi kriteria."
                />
            </div>
        </div>
    );
};

const ProgressIndicator = ({ active, label }: { active: boolean; label: string }) => (
    <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg border text-[10px] font-bold transition-all ${
        active ? 'bg-green-600 border-green-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
        {label}
    </div>
);
