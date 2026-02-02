import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents, sendWarningToStudent, type WarningType } from "@/services/lecturerGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toTitleCaseName } from "@/lib/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Clock, CalendarCheck, Milestone, Bell, AlertTriangle } from "lucide-react";
import { Loading, Spinner } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getDaysRemaining = (deadlineDate?: string | null) => {
  if (!deadlineDate) return null;
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getRatingConfig = (rating?: string) => {
  switch (rating) {
    case "ONGOING":
      return { variant: "outline" as const, label: "Ongoing", className: "border-green-500 text-green-600 bg-green-50", needsWarning: false };
    case "SLOW":
      return { variant: "secondary" as const, label: "Slow", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", needsWarning: true };
    case "AT_RISK":
      return { variant: "destructive" as const, label: "At Risk", className: "", needsWarning: true };
    case "FAILED":
      return { variant: "destructive" as const, label: "Gagal", className: "", needsWarning: true };
    default:
      return { variant: "outline" as const, label: "Ongoing", className: "border-green-500 text-green-600 bg-green-50", needsWarning: false };
  }
};

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" }, { label: "Mahasiswa Bimbingan" }], []);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Warning dialog state
  const [warningDialog, setWarningDialog] = useState<{
    open: boolean;
    student: MyStudentItem | null;
  }>({ open: false, student: null });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lecturer-my-students'],
    queryFn: () => getMyStudents(),
  });

  // Send warning mutation
  const sendWarningMutation = useMutation({
    mutationFn: ({ thesisId, warningType }: { thesisId: string; warningType: WarningType }) =>
      sendWarningToStudent(thesisId, warningType),
    onSuccess: (data) => {
      toast.success(data.message || "Peringatan berhasil dikirim");
      setWarningDialog({ open: false, student: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengirim peringatan");
    },
  });

  const handleSendWarning = () => {
    const student = warningDialog.student;
    if (!student?.thesisId || !student?.thesisRating) return;
    sendWarningMutation.mutate({
      thesisId: student.thesisId,
      warningType: student.thesisRating as WarningType,
    });
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!data?.students) return [];
    if (!searchQuery.trim()) return data.students;
    
    const query = searchQuery.toLowerCase();
    return data.students.filter((student: MyStudentItem) => 
      toTitleCaseName(student.fullName).toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query)
    );
  }, [data?.students, searchQuery]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, page, pageSize]);

  const columns: Column<MyStudentItem>[] = useMemo(() => [
    {
      key: 'fullName',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-medium">{toTitleCaseName(row.fullName)}</div>
          <div className="text-xs text-muted-foreground">{row.identityNumber || '-'}</div>
        </div>
      ),
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      render: (row) => (
        <div className="space-y-1">
          <div className="max-w-62.5 truncate font-medium" title={row.thesisTitle}>
            {row.thesisTitle || '-'}
          </div>
          <Badge variant="outline" className="text-xs">{row.thesisStatus || 'Ongoing'}</Badge>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress Milestone',
      render: (row) => {
        const total = row.totalMilestones || 0;
        const completed = row.completedMilestones || 0;
        const progress = row.milestoneProgress || 0;
        
        return (
          <div className="space-y-1.5 min-w-35">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Milestone className="h-3 w-3" />
                {completed}/{total}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {row.latestMilestone && (
              <div className="text-xs text-muted-foreground truncate max-w-35" title={row.latestMilestone}>
                {row.latestMilestone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'guidanceCount',
      header: 'Bimbingan',
      render: (row) => (
        <div className="space-y-0.5 text-sm">
          <div className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{row.completedGuidanceCount || 0}x</span>
          </div>
          {row.lastGuidanceDate ? (
            <div className="text-xs text-muted-foreground">
              Terakhir: {row.lastGuidanceDate}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Belum pernah</div>
          )}
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Sisa Waktu',
      render: (row) => {
        const days = getDaysRemaining(row.deadlineDate);
        if (days === null) return <span className="text-muted-foreground">-</span>;
        
        if (days < 0) {
          return (
            <Badge variant="destructive" className="items-center gap-1">
               <Clock className="h-3 w-3" />
               Lewat {Math.abs(days)} hari
            </Badge>
          );
        }
        
        if (days <= 30) {
           return (
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 items-center gap-1">
               <Clock className="h-3 w-3" />
               {days} hari
            </Badge>
           );
        }

        return (
           <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{days} hari</span>
           </div>
        );
      }
    },
    {
      key: 'thesisRating',
      header: 'Rating',
      render: (row) => {
        const config = getRatingConfig(row.thesisRating);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} className={cn("whitespace-nowrap", config.className)}>
              {config.label}
            </Badge>
            {config.needsWarning && (
              <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => {
        const config = getRatingConfig(row.thesisRating);
        return (
          <div className="flex items-center gap-1">
            {config.needsWarning && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setWarningDialog({ open: true, student: row })}
                      className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="sr-only">Kirim Peringatan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kirim Peringatan ke Mahasiswa</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/my-students/${row.thesisId}`)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Detail</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lihat Detail</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      }
    }
  ], [navigate]);

  // Define tabs for reuse
  const tabs = [
    { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
    { label: 'Terjadwal', to: '/tugas-akhir/bimbingan/lecturer/scheduled' },
    { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
  ];

  return (
    <div className="p-4 space-y-4">
      <TabsNav tabs={tabs} />

      {/* Loading state - tabs tetap render, loading di content */}
      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data mahasiswa bimbingan..." />
        </div>
      ) : (
        <CustomTable
          columns={columns}
          data={paginatedData}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          total={filteredData.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchValue={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1); // Reset to page 1 on search
          }}
          emptyText="Tidak ada mahasiswa bimbingan"
          rowKey={(row) => row.studentId}
          actions={
            <RefreshButton 
              onClick={() => refetch()} 
              isRefreshing={isFetching && !isLoading} 
            />
          }
        />
      )}

      {/* Warning Confirmation Dialog */}
      <AlertDialog open={warningDialog.open} onOpenChange={(open) => setWarningDialog({ open, student: open ? warningDialog.student : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Kirim Peringatan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan mengirim notifikasi peringatan ke mahasiswa:
                </p>
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="font-medium">{toTitleCaseName(warningDialog.student?.fullName || "")}</p>
                  <p className="text-sm">{warningDialog.student?.identityNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span>Status saat ini:</span>
                  <Badge 
                    variant={getRatingConfig(warningDialog.student?.thesisRating).variant}
                    className={getRatingConfig(warningDialog.student?.thesisRating).className}
                  >
                    {getRatingConfig(warningDialog.student?.thesisRating).label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mahasiswa akan menerima notifikasi push dan in-app notification untuk mengingatkan progress tugas akhir mereka.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendWarningMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendWarning}
              disabled={sendWarningMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {sendWarningMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Kirim Peringatan
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
