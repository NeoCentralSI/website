import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents } from "@/services/lecturerGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName } from "@/lib/text";

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Mahasiswa Bimbingan" }], []);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['lecturer-my-students'],
    queryFn: getMyStudents,
  });

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!data?.students) return [];
    if (!searchQuery.trim()) return data.students;
    
    const query = searchQuery.toLowerCase();
    return data.students.filter(student => 
      toTitleCaseName(student.fullName).toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.identityNumber?.toLowerCase().includes(query)
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
  ], []);

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
