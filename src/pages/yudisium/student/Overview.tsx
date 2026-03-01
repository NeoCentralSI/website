import { useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function YudisiumOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    useEffect(() => {
        setBreadcrumbs([{ label: "Yudisium" }]);
        setTitle("Overview Yudisium");
    }, [setBreadcrumbs, setTitle]);

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Yudisium</CardTitle>
                    <CardDescription>Halaman overview Yudisium (Coming Soon)</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
