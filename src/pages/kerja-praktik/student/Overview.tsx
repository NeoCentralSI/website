import { ExplorerTab } from "@/components/internship/student/overview/ExplorerTab";
import { HistoryTab } from "@/components/internship/student/overview/HistoryTab";
import { StatusTab } from "@/components/internship/student/overview/StatusTab";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Loading } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudentInternshipHistory, getStudentLogbooks } from "@/services/internship.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";

export default function KerjaPraktekOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "status";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", value);
        setSearchParams(params, { replace: true });
    };

    useEffect(() => {
        setBreadcrumbs([{ label: "Kerja Praktik" }]);
        setTitle("Overview Kerja Praktik");
    }, [setBreadcrumbs, setTitle]);

    const { data: logbooksData, isLoading } = useQuery({
        queryKey: ["student-logbooks"],
        queryFn: getStudentLogbooks,
    });

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ["student-internship-history"],
        queryFn: getStudentInternshipHistory,
        enabled: activeTab === "history",
    });

    if (isLoading) {
        return <Loading size="lg" text="Memuat data Kerja Praktik..." />;
    }

    const internship = logbooksData?.data?.internship;
    const logbooks = logbooksData?.data?.logbooks || [];

    return (
        <div className="flex flex-1 flex-col p-6 w-full">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 w-full">
                <TabsList>
                    <TabsTrigger value="status">Status Terkini</TabsTrigger>
                    <TabsTrigger value="history">Riwayat KP</TabsTrigger>
                    <TabsTrigger value="explorer">Jelajah</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="w-full space-y-6">
                    <StatusTab internship={internship} logbooks={logbooks} />
                </TabsContent>

                <TabsContent value="history" className="w-full space-y-6">
                    <HistoryTab
                        items={historyData?.data || []}
                        isLoading={isHistoryLoading}
                    />
                </TabsContent>

                <TabsContent value="explorer" className="w-full space-y-6">
                    <ExplorerTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
