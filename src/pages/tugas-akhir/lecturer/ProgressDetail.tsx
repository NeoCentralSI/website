import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProgressDetailItem } from "@/services/lecturerGuidance.service";
import { approveProgressComponents, finalApproval, failThesis, getProgressDetail } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";

export default function LecturerProgressDetailPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/progress" }, { label: "Detail" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<ProgressDetailItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await getProgressDetail(studentId);
      setComponents(data.components || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const approveSelected = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!studentId || ids.length === 0) {
      toast.message("Pilih minimal satu komponen");
      return;
    }
    try {
      await approveProgressComponents(studentId, ids.map((componentId) => ({ componentId, approved: true })));
      toast.success("Komponen divalidasi");
      setSelected({});
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memvalidasi");
    }
  };

  const doFinalApproval = async () => {
    if (!studentId) return;
    try {
      await finalApproval(studentId);
      toast.success("Final approval berhasil");
      navigate(-1);
    } catch (e: any) {
      toast.error(e?.message || "Gagal final approval");
    }
  };

  const doFail = async () => {
    if (!studentId) return;
    try {
      await failThesis(studentId);
      toast.success("Status menjadi failed");
      navigate(-1);
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengubah status");
    }
  };

  return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Kembali</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={doFinalApproval}>Final Approve</Button>
            <Button variant="destructive" onClick={doFail}>Fail Thesis</Button>
          </div>
        </div>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Komponen Progres</div>
            <Button size="sm" onClick={approveSelected}>Setujui Terpilih</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Komponen</TableHead>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Pembimbing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {components.map((c) => (
                <TableRow key={c.componentId}>
                  <TableCell>
                    <Checkbox checked={!!selected[c.componentId]} onCheckedChange={() => toggle(c.componentId)} disabled={c.approvedBySupervisor} />
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.isCompleted ? "Selesai" : "Belum"}</TableCell>
                  <TableCell>{c.approvedBySupervisor ? "Disetujui" : "Belum"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
