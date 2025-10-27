import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// no Select component available, using native select inputs
import { useNavigate } from "react-router-dom";
import type { GuidanceItem, GuidanceStatus, SupervisorItem } from "@/services/studentGuidance.service";
import { listStudentGuidance, requestStudentGuidance, getStudentSupervisors } from "@/services/studentGuidance.service";
import { toast } from "sonner";

export default function StudentGuidancePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<GuidanceStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GuidanceItem[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorItem[]>([]);
  const [openRequest, setOpenRequest] = useState(false);
  const [form, setForm] = useState({
    supervisorId: "",
    preferredTime: "",
    topic: "",
    note: "",
    location: "",
    meetingType: "online" as "online" | "offline" | "hybrid",
  });

  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }], []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [guidances, sup] = await Promise.all([
        listStudentGuidance(status ? { status } : undefined),
        getStudentSupervisors().catch(() => ({ supervisors: [] as SupervisorItem[], success: true, thesisId: "" })),
      ]);
      setItems(guidances.items);
      setSupervisors(sup.supervisors || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submitRequest = async () => {
    try {
      if (!form.supervisorId || !form.preferredTime) {
        toast.error("Pilih pembimbing dan waktu bimbingan");
        return;
      }
      await requestStudentGuidance({ ...form });
      toast.success("Pengajuan bimbingan terkirim");
      setOpenRequest(false);
      setForm({ supervisorId: "", preferredTime: "", topic: "", note: "", location: "", meetingType: "online" });
      fetchAll();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengajukan bimbingan");
    }
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumb}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status</Label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as GuidanceStatus | "")}
            >
              <option value="">Semua</option>
              <option value="scheduled">Terjadwal</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate("/tugas-akhir/bimbingan/progress")}>Progres</Button>
            <Button variant="secondary" onClick={() => navigate("/tugas-akhir/bimbingan/history")}>Riwayat</Button>
            <Button variant="secondary" onClick={() => navigate("/tugas-akhir/bimbingan/activity")}>Aktivitas</Button>
            <Button variant="secondary" onClick={() => navigate("/tugas-akhir/bimbingan/supervisors")}>Pembimbing</Button>
            <Dialog open={openRequest} onOpenChange={setOpenRequest}>
              <DialogTrigger asChild>
                <Button>Ajukan Bimbingan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajukan Bimbingan</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label>Pembimbing</Label>
                    <select
                      className="border rounded px-2 py-2"
                      value={form.supervisorId}
                      onChange={(e) => setForm((f) => ({ ...f, supervisorId: e.target.value }))}
                    >
                      <option value="">Pilih Pembimbing</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Waktu Diinginkan</Label>
                    <Input type="datetime-local" value={form.preferredTime} onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Topik</Label>
                    <Input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Catatan</Label>
                    <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Lokasi</Label>
                    <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Jenis Pertemuan</Label>
                    <select
                      className="border rounded px-2 py-2"
                      value={form.meetingType}
                      onChange={(e) => setForm((f) => ({ ...f, meetingType: e.target.value as any }))}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" onClick={() => setOpenRequest(false)}>Batal</Button>
                    <Button onClick={submitRequest}>Kirim</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pembimbing</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Tidak ada data</TableCell>
                </TableRow>
              )}
              {items.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>{g.supervisorName || g.supervisorId}</TableCell>
                  <TableCell>{g.scheduledAt ? new Date(g.scheduledAt).toLocaleString() : '-'}</TableCell>
                  <TableCell className="capitalize">{g.status}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/tugas-akhir/bimbingan/${g.id}`)}>Detail</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
