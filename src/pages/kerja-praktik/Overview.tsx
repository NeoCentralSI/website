import { useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function KerjaPraktekOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    useEffect(() => {
        setBreadcrumbs([{ label: "Kerja Praktik" }]);
        setTitle("Overview Kerja Praktik");
    }, [setBreadcrumbs, setTitle]);

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Kerja Praktik</CardTitle>
                    <CardDescription>Halaman overview Kerja Praktik (Coming Soon)</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
