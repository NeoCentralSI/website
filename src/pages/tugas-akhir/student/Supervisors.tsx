import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentSupervisors } from "@/services/studentGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import EmptyState from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName } from "@/lib/text";

export default function SupervisorsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Pembimbing" }], []);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-supervisors'],
    queryFn: async () => {
      const res = await getStudentSupervisors();
      return res.supervisors;
    },
  });

  const items = data ?? [];

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
        ]}
      />
      {isError ? (
        <EmptyState 
          title="Gagal Memuat Data"
          description="Terjadi kesalahan saat memuat data pembimbing"
          size="sm"
        />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState 
          title="Belum Ada Pembimbing"
          description="Belum ada data pembimbing untuk tugas akhir Anda"
          size="sm"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((supervisor) => (
            <Card key={supervisor.id} className="p-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={supervisor.avatarUrl} alt={supervisor.name} />
                <AvatarFallback>
                  {supervisor.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{toTitleCaseName(supervisor.name)}</div>
                <div className="text-xs text-muted-foreground">{supervisor.email || '-'}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
