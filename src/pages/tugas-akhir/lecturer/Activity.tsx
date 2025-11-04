import { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ActivityLogItem } from "@/services/lecturerGuidance.service";
import { getLecturerActivityLog } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";

export default function LecturerActivityPage() {
  const { studentId } = useParams();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Aktivitas" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ActivityLogItem[]>([]);

  const load = async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const data = await getLecturerActivityLog(studentId);
      setItems(data.items);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat aktivitas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return (
      <div className="p-4">
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{a.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
