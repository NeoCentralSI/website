import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProgressDetailItem } from "@/services/studentGuidance.service";
import { completeStudentProgressComponents, getStudentProgressDetail } from "@/services/studentGuidance.service";
import { toast } from "sonner";

export default function StudentProgressPage() {
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Progres" }], []);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<ProgressDetailItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await getStudentProgressDetail();
      setComponents(data.components || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat progres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const submit = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) {
      toast.message("Pilih minimal satu komponen");
      return;
    }
    try {
      await completeStudentProgressComponents({ components: ids.map((componentId) => ({ componentId })) });
      toast.success("Progres diperbarui");
      setSelected({});
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumb}>
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Komponen Progres</div>
            <Button size="sm" onClick={submit}>Tandai Selesai</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Komponen</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {components.map((c) => (
                <TableRow key={c.componentId}>
                  <TableCell>
                    <Checkbox checked={!!selected[c.componentId]} onCheckedChange={() => toggle(c.componentId)} disabled={c.isCompleted} />
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.isCompleted ? "Selesai" : "Belum"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
