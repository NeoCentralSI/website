import { useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { getStudentSupervisors } from "@/services/studentGuidance.service";
import { TabsNav } from "@/components/ui/tabs-nav";
import EmptyState from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName } from "@/lib/text";
import { Copy, Check, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SupervisorsPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const breadcrumb = useMemo(() => [{ label: "Tugas Akhir" }, { label: "Bimbingan", href: "/tugas-akhir/bimbingan" }, { label: "Pembimbing" }], []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumb);
    setTitle(undefined);
  }, [breadcrumb, setBreadcrumbs, setTitle]);

  const { data, isPending, isError } = useQuery({
    queryKey: ['student-supervisors'],
    queryFn: getStudentSupervisors,
  });

  const items = Array.isArray(data?.supervisors) ? data.supervisors : [];

  const copyEmail = async (id: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      toast.success('Email berhasil disalin');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Gagal menyalin email');
    }
  };

  return (
    <div className="p-4">
      <TabsNav
        preserveSearch
        tabs={[
          { label: 'Bimbingan', to: '/tugas-akhir/bimbingan/student', end: true },
          { label: 'Pembimbing', to: '/tugas-akhir/bimbingan/supervisors' },
          { label: 'Milestone', to: '/tugas-akhir/bimbingan/milestone' },
          { label: 'Riwayat', to: '/tugas-akhir/bimbingan/completed-history' },
        ]}
      />

      {/* Loading state - tabs tetap render, loading di content */}
      {isPending ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data pembimbing..." />
        </div>
      ) : isError ? (
        <EmptyState 
          title="Gagal Memuat Data"
          description="Terjadi kesalahan saat memuat data pembimbing"
          size="sm"
        />
      ) : items.length === 0 ? (
        <EmptyState 
          title="Belum Ada Pembimbing"
          description="Belum ada data pembimbing untuk tugas akhir Anda"
          size="sm"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((supervisor) => {
            const name = supervisor.name || 'Pembimbing';
            const email = supervisor.email;
            const isCopied = copiedId === supervisor.id;
            
            return (
              <Card key={supervisor.id} className="p-4 hover:shadow-md transition-shadow">
                {/* Role Badge */}
                {supervisor.role && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                    <User className="h-3 w-3" />
                    {formatRoleName(supervisor.role)}
                  </div>
                )}
                
                {/* Name */}
                <h3 className="text-base font-semibold text-foreground">
                  {toTitleCaseName(name)}
                </h3>
                
                {/* Email with copy button */}
                {email && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-muted/50">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {email}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 hover:bg-background text-xs"
                      onClick={() => copyEmail(supervisor.id, email)}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span className="ml-1 text-xs">
                        {isCopied ? 'Disalin' : 'Salin'}
                      </span>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
