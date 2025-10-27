import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActivityLogItem } from "@/services/studentGuidance.service";
import { getStudentActivityLog } from "@/services/studentGuidance.service";
import { toast } from "sonner";

export default function ActivityLogPage() {
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Aktivitas" }], []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActivityLogItem[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getStudentActivityLog();
      setItems(data.items);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat aktivitas");
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
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Pelaku</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.actor || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
