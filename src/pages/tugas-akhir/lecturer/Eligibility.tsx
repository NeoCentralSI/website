import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupervisorEligibility } from "@/services/lecturerGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";

export default function LecturerEligibilityPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan" }, { label: "Eligibility Pembimbing 1" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const [threshold, setThreshold] = useState<number | "">("");
  const [result, setResult] = useState<{ eligible: boolean; graduatedAsSup2: number; required: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    try {
      const data = await getSupervisorEligibility(typeof threshold === 'number' ? { threshold } : undefined);
      setResult({ eligible: data.eligible, graduatedAsSup2: data.graduatedAsSup2, required: data.required });
    } catch (e: any) {
      toast.error(e?.message || "Gagal memeriksa eligibility");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Card className="p-4 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Threshold (opsional)</div>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
            <Button onClick={check} disabled={loading}>{loading ? 'Memeriksa...' : 'Periksa'}</Button>
          </div>
          {result && (
            <div className="space-y-1">
              <div>Eligible: <span className={result.eligible ? 'text-green-600' : 'text-red-600'}>{String(result.eligible)}</span></div>
              <div>Lulus sebagai SUPERVISOR_2: {result.graduatedAsSup2}</div>
              <div>Dibutuhkan: {result.required}</div>
            </div>
          )}
        </Card>
      </div>
  );
}
