import { Link, Outlet, useLocation, useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ClipboardList, Award, LogOut, User, Building2, Calendar, ShieldCheck, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { cn } from '@/lib/utils';
import logo from '@/assets/images/neocentral-logo.png';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function FieldAssessmentLayout() {
    const { token } = useParams<{ token: string }>();
    const { data } = useOutletContext<any>();
    const location = useLocation();
    const navigate = useNavigate();
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleExit = () => {
        sessionStorage.removeItem(`field_assessment_pin_${token}`);
        navigate(`/field-assessment/${token}`);
    };

    const menuItems = [
        {
            label: 'Logbook Mahasiswa',
            icon: ClipboardList,
            path: `/field-assessment/${token}/logbook`,
        },
        {
            label: 'Input Penilaian',
            icon: Award,
            path: `/field-assessment/${token}/nilai`,
        }
    ];

    return (
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <img src={logo} alt="Logo" className="h-8 w-8" />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                                NEO<span className="text-primary">CENTRAL</span>
                            </h1>
                            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Portal Pembimbing</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm group",
                                        isActive 
                                            ? "bg-primary/10 text-primary" 
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600")} />
                                    {item.label}
                                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <Separator className="bg-slate-100 mx-6 w-auto" />

                <ScrollArea className="flex-1 px-6 py-6">
                    <div className="space-y-6">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Informasi Mahasiswa</p>
                            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/60 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{data.internship.studentName}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{data.internship.studentNim}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-slate-200/60">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Building2 className="h-3.5 w-3.5 opacity-70" />
                                        <p className="text-[11px] font-medium truncate">{data.internship.companyName}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                                        <p className="text-[11px] font-medium truncate">{data.internship.academicYear}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {data.internship.companyReportDoc && (
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Dokumen Laporan</p>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start gap-3 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs h-auto py-3 rounded-lg group"
                                    onClick={() => setPreviewOpen(true)}
                                >
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="overflow-hidden text-left">
                                        <p className="text-xs font-semibold leading-tight truncate">Laporan Instansi</p>
                                        <p className="text-[10px] text-slate-500 mt-1 truncate">Klik untuk melihat file</p>
                                    </div>
                                </Button>
                            </div>
                        )}

                        {data.internship.isUsed && (
                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-md bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-900">Penilaian Selesai</p>
                                    <p className="text-[10px] font-medium text-emerald-600">Data telah terkirim</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6">
                    <Button 
                        variant="ghost" 
                        onClick={handleExit}
                        className="w-full justify-start gap-3 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium text-sm h-11"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar Portal
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            {menuItems.find(i => i.path === location.pathname)?.label || 'Portal Penilaian'}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-900 leading-none">{data.internship.fieldSupervisorName || 'Pembimbing Lapangan'}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-1">{data.internship.unitSection || '-'}</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 bg-[#F8FAFC]">
                    <Outlet context={useOutletContext()} />
                </div>
            </main>

            {data.internship.companyReportDoc && (
                <DocumentPreviewDialog 
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    fileName={data.internship.companyReportDoc.fileName}
                    filePath={data.internship.companyReportDoc.filePath}
                />
            )}
        </div>
    );
}
