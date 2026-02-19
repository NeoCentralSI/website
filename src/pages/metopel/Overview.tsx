import { useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MetopenOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    useEffect(() => {
        setBreadcrumbs([{ label: "Metode Penelitian" }]);
        setTitle("Overview Metode Penelitian");
    }, [setBreadcrumbs, setTitle]);

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Metode Penelitian</CardTitle>
                    <CardDescription>Halaman overview Metode Penelitian (Coming Soon)</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
