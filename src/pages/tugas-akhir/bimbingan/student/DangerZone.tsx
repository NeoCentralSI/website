import { useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudentSupervisors } from "@/services/studentGuidance.service";
import { ThesisChangeRequestCard } from "@/components/tugas-akhir/student/ThesisChangeRequestCard";
import { Loading } from "@/components/ui/spinner";

export default function DangerZonePage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const breadcrumb = useMemo(() => [
        { label: "Tugas Akhir", href: "/tugas-akhir" },
        { label: "Zona Berbahaya" }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    // Get thesisId
    const { data: supervisorsData, isLoading } = useQuery({
        queryKey: ["student-supervisors"],
        queryFn: getStudentSupervisors,
    });

    const thesisId = supervisorsData?.thesisId || "";

    if (isLoading) {
        return <Loading size="lg" text="Memuat data..." />;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Zona Berbahaya</h1>
                    <p className="text-gray-500">Pengaturan krusial tugas akhir</p>
                </div>
            </div>

            <div className="space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Perhatian!</AlertTitle>
                    <AlertDescription>
                        Tindakan di halaman ini bersifat krusial dan dapat mempengaruhi proses tugas akhir Anda.
                        Pastikan Anda telah berkonsultasi dengan dosen pembimbing sebelum melakukan perubahan.
                    </AlertDescription>
                </Alert>

                {thesisId ? (
                    <ThesisChangeRequestCard thesisId={thesisId} />
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        Tidak ada data tugas akhir yang ditemukan.
                    </div>
                )}
            </div>
        </div>
    );
}
