import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import type { ProgressDetailItem } from "@/services/studentGuidance.service";
import { completeStudentProgressComponents, getStudentProgressDetail } from "@/services/studentGuidance.service";
import { toast } from "sonner";
import { TabsNav } from "@/components/ui/tabs-nav";
import ProgressChecklist from "@/components/thesis/ProgressChecklist";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function StudentProgressPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Progres" }], []);
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["student-progress"],
    queryFn: async () => {
      const res = await getStudentProgressDetail();
      return (res.components || []) as ProgressDetailItem[];
    },
  });
  const components: ProgressDetailItem[] = useMemo(() => (data ?? []) as ProgressDetailItem[], [data]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const completeMutation = useMutation({
    mutationFn: async (ids: string[]) => completeStudentProgressComponents({ componentIds: ids }),
    onSuccess: () => {
      toast.success("Progres diperbarui");
      setSelected({});
      qc.invalidateQueries({ queryKey: ["student-progress"] });
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan"),
  });
  const submit = () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return toast.message("Pilih minimal satu komponen");
    completeMutation.mutate(ids);
  };

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Progres', to: '/tugas-akhir/bimbingan/progress' },
          { label: 'Aktivitas', to: '/tugas-akhir/bimbingan/activity' },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
        ]}
      />

      <ProgressChecklist
        items={components}
        loading={isLoading}
        selected={selected}
        onToggle={toggle}
        onCompleteSelected={submit}
        onCompleteOne={async (id: string) => {
          completeMutation.mutate([id]);
        }}
      />
    </div>
  );
}
