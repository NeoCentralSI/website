import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ProgressSummaryItem } from "@/services/lecturerGuidance.service";
import { getProgressSummary } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TabsNav } from "@/components/ui/tabs-nav";

export default function LecturerProgressPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Progres" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ProgressSummaryItem[]>([]);
  const navigate = useNavigate();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getProgressSummary();
      setItems(data.items);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat ringkasan");
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
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Komplet</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>{s.studentName || s.studentId}</TableCell>
                  <TableCell>{s.completed}</TableCell>
                  <TableCell>{s.total}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/progress/${s.studentId}`)}>Lihat</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
