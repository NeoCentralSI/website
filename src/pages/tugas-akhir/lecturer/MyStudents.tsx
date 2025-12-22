import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents } from "@/services/lecturerGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName } from "@/lib/text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, History, Activity, Target } from "lucide-react";

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Mahasiswa Bimbingan" }], []);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const [searchQuery, setSearchQuery] = useState("");

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

  const columns: Column<MyStudentItem>[] = useMemo(() => [
    {
      key: 'fullName',
      header: 'Nama',
      render: (row) => toTitleCaseName(row.fullName),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email || '-',
    },
    {
      key: 'roles',
      header: 'Peran',
      render: (row) => row.roles?.map(formatRoleName).join(', ') || '-',
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/milestone/${row.studentId}`)}
            >
              <Target className="h-4 w-4 mr-2" />
              Lihat Milestone
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/history/${row.studentId}`)}
            >
              <History className="h-4 w-4 mr-2" />
              Riwayat Bimbingan
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/activity/${row.studentId}`)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Log Aktivitas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate]);

  return (
    <div className="p-4 space-y-4">
      <TabsNav
        tabs={[
          { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
          { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
        ]}
      />
      
      <CustomTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        total={filteredData.length}
        page={1}
        pageSize={filteredData.length || 10}
        onPageChange={() => {}}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyText="Tidak ada mahasiswa bimbingan"
        rowKey={(row) => row.studentId}
      />
    </div>
  );
}
