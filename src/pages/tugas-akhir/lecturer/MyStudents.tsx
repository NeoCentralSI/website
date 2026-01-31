import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents } from "@/services/lecturerGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName } from "@/lib/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Clock } from "lucide-react";
import { Loading } from "@/components/ui/spinner";

const getDaysRemaining = (deadlineDate?: string) => {
  if (!deadlineDate) return null;
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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

  const { data, isLoading } = useQuery({
    queryKey: ['lecturer-my-students'],
    queryFn: () => getMyStudents(),
  });

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
          <div className="text-xs text-muted-foreground">{row.email || '-'}</div>
          {row.identityNumber && <div className="text-xs text-muted-foreground">{row.identityNumber}</div>}
        </div>
      ),
    },
    {
      key: 'thesisTitle',
      header: 'Judul Skripsi',
      render: (row) => <div className="max-w-[300px] truncate" title={row.thesisTitle}>{row.thesisTitle || '-'}</div>,
    },
    {
      key: 'latestMilestone',
      header: 'Progress',
      render: (row) => <Badge variant="outline">{row.latestMilestone || "-"}</Badge>,
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
               Expired ({Math.abs(days)} hari)
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
      header: 'Status',
      render: (row) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let displayLabel = "Ongoing";
        let className = "";
  
        switch (row.thesisRating) {
            case "ONGOING": 
              variant = "outline"; 
              displayLabel = "Ongoing";
              className = "border-green-500 text-green-600 bg-green-50"; 
              break;
            case "SLOW": 
              variant = "secondary"; 
              displayLabel = "Slow"; 
              className = "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
              break;
            case "AT_RISK": 
              variant = "destructive"; 
              displayLabel = "At Risk"; 
              break;
            case "FAILED": 
              variant = "destructive"; 
              displayLabel = "Gagal / Timeout"; 
              break;
            default:
              displayLabel = "Ongoing";
        }

        return (
          <Badge variant={variant} className={`whitespace-nowrap ${className}`}>
            {displayLabel}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/my-students/${row.thesisId}`)}
            className="h-8 w-8 p-0"
        >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Detail</span>
        </Button>
      )
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
        />
      )}
    </div>
  );
}
