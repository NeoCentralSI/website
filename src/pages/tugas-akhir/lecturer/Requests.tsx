import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { approveGuidanceRequest, getPendingRequests, rejectGuidanceRequest } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";

export default function LecturerRequestsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Permintaan" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GuidanceItem[]>([]);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectMsg, setRejectMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingRequests();
      setItems(data.requests);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat permintaan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const doApprove = async (id: string) => {
    try {
      await approveGuidanceRequest(id);
      toast.success("Permintaan disetujui");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyetujui");
    }
  };

  const doReject = async () => {
    if (!rejectOpen) return;
    try {
      await rejectGuidanceRequest(rejectOpen, { message: rejectMsg });
      toast.success("Permintaan ditolak");
      setRejectOpen(null);
      setRejectMsg("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menolak");
    }
  };

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
                <TableHead>Diminta</TableHead>
                <TableHead>Terjadwal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Tidak ada permintaan</TableCell>
                </TableRow>
              )}
              {items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.studentName || g.studentId}</TableCell>
                  <TableCell>{g.requestedAt ? new Date(g.requestedAt).toLocaleString() : '-'}</TableCell>
                  <TableCell>{g.scheduledAt ? new Date(g.scheduledAt).toLocaleString() : '-'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" onClick={() => doApprove(g.id)}>Setujui</Button>
                    <Dialog open={rejectOpen === g.id} onOpenChange={(o) => setRejectOpen(o ? g.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">Tolak</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Alasan Penolakan</DialogTitle>
                        </DialogHeader>
                        <Input value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)} placeholder="Masukkan alasan" />
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" onClick={() => setRejectOpen(null)}>Batal</Button>
                          <Button variant="destructive" onClick={doReject}>Kirim</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
