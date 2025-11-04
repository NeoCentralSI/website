import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MyStudentItem } from "@/services/lecturerGuidance.service";
import { getMyStudents } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";

export default function LecturerMyStudentsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Mahasiswa Bimbingan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<MyStudentItem[]>([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getMyStudents();
      setItems(data.students);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat mahasiswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
      <div className="p-4">
        <TabsNav
          tabs={[
            { label: 'Permintaan', to: '/tugas-akhir/bimbingan/lecturer/requests' },
            { label: 'Progres', to: '/tugas-akhir/bimbingan/lecturer/progress' },
            { label: 'Mahasiswa', to: '/tugas-akhir/bimbingan/lecturer/my-students' },
            { label: 'Eligibility', to: '/tugas-akhir/bimbingan/lecturer/eligibility' },
          ]}
        />
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>{s.fullName}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell>{s.roles?.join(', ') || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
