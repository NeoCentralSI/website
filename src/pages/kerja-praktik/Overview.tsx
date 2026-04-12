import { useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { useQuery } from "@tanstack/react-query";
import { getStudentLogbooks } from "@/services/internship/student.service";
import { Loading } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTab } from "@/components/internship/student/overview/StatusTab";
import { ExplorerTab } from "@/components/internship/student/overview/ExplorerTab";

export default function KerjaPraktekOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    useEffect(() => {
        setBreadcrumbs([{ label: "Kerja Praktik" }]);
        setTitle("Overview Kerja Praktik");
    }, [setBreadcrumbs, setTitle]);

    const { data: logbooksData, isLoading } = useQuery({
        queryKey: ["student-logbooks"],
        queryFn: getStudentLogbooks,
    });

    if (isLoading) {
        return <Loading size="lg" text="Memuat data Kerja Praktik..." />;
    }

    const internship = logbooksData?.data?.internship;
    const logbooks = logbooksData?.data?.logbooks || [];

    return (
        <div className="flex flex-1 flex-col p-6 w-full">
            <Tabs defaultValue="status" className="space-y-6 w-full">
                <TabsList>
                    <TabsTrigger value="status">Status Terkini</TabsTrigger>
                    <TabsTrigger value="explorer">Jelajah</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="w-full space-y-6">
                    <StatusTab internship={internship} logbooks={logbooks} />
                </TabsContent>

                <TabsContent value="explorer" className="w-full space-y-6">
                    <ExplorerTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
