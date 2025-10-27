import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GuidanceItem } from "@/services/studentGuidance.service";
import { getStudentGuidanceHistory } from "@/services/studentGuidance.service";
import { toast } from "sonner";

export default function GuidanceHistoryPage() {
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Riwayat" }], []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GuidanceItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getStudentGuidanceHistory();
      setItems(data.items);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout breadcrumbs={breadcrumb}>
      <div className="p-4">
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pembimbing</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.supervisorName || g.supervisorId}</TableCell>
                  <TableCell>{g.scheduledAt ? new Date(g.scheduledAt).toLocaleString() : '-'}</TableCell>
                  <TableCell className="capitalize">{g.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
