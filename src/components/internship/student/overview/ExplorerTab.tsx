import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

import { getOverviewStats, getOverviewCompanies, getOverviewReports } from "@/services/internship.service";
import type { OverviewReportItem, OverviewCompanyItem } from "@/services/internship.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, FileText, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateId } from "@/lib/text";
import { InternshipTable, type Column } from "@/components/internship/InternshipTable";

export function ExplorerTab() {
    // Queries
    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['overviewStats'],
        queryFn: getOverviewStats,
    });

    const [compSearch, setCompSearch] = useState("");
    const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
        queryKey: ['overviewCompanies', compSearch],
        queryFn: () => getOverviewCompanies({ search: compSearch, limit: 10 }),
    });

    const [reportSearch, setReportSearch] = useState("");
    const { data: reportsData, isLoading: isLoadingReports } = useQuery({
        queryKey: ['overviewReports', reportSearch],
        queryFn: () => getOverviewReports({ search: reportSearch, limit: 10 }),
    });

    const stats = statsData?.data;
    const companies = companiesData?.data || [];
    const reports = reportsData?.data || [];

    const [searchParams, setSearchParams] = useSearchParams();
    const activeView = searchParams.get("view") || "reports";

    const handleViewChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("view", value);
        setSearchParams(params, { replace: true });
    };

    // Columns for Reports Table
    const reportColumns: Column<OverviewReportItem>[] = [
        {
            key: "reportTitle",
            header: "Judul Laporan",
            render: (row) => (
                <div className="font-medium max-w-[350px]">
                    <div className="line-clamp-2" title={row.reportTitle}>{row.reportTitle}</div>
                    {row.uploadedAt && (
                        <p className="text-xs text-muted-foreground font-normal mt-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1 inline" /> {formatDateId(new Date(row.uploadedAt))}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: "studentName",
            header: "Mahasiswa",
            render: (row) => (
                <div>
                    <div>{row.studentName}</div>
                    <div className="text-xs text-muted-foreground">{row.nim}</div>
                </div>
            )
        },
        {
            key: "companyName",
            header: "Perusahaan",
            accessor: "companyName",
            className: "text-muted-foreground"
        },
        {
            key: "academicYear",
            header: "Tahun Akademik",
            render: (row) => (
                <Badge variant="outline" className="font-medium whitespace-nowrap">
                    {row.academicYear || '-'}
                </Badge>
            )
        },
        {
            key: "actions",
            header: "Aksi",
            className: "text-center",
            render: (row) => (
                row.fileId ? (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/documents/view/${row.fileId}`, '_blank')}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground italic">File tidak tersedia</span>
                )
            )
        }
    ];

    // Columns for Companies Table
    const companyColumns: Column<OverviewCompanyItem>[] = [
        {
            key: "companyName",
            header: "Nama Perusahaan",
            render: (row) => (
                <div className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    {row.companyName}
                </div>
            )
        },
        {
            key: "companyAddress",
            header: "Alamat",
            render: (row) => (
                <div className="text-muted-foreground text-sm max-w-[300px] truncate" title={row.companyAddress}>
                    {row.companyAddress}
                </div>
            )
        },
        {
            key: "internCount",
            header: "Alumni",
            className: "text-center",
            render: (row) => (
                <Badge variant="secondary" className="px-2 font-medium">
                    {row.internCount} Mahasiswa
                </Badge>
            )
        },
        {
            key: "status",
            header: "Status",
            className: "text-center",
            render: (row) => (
                row.status === 'save' ? (
                    <Badge className="bg-green-600 hover:bg-green-700 font-normal">Whitelist</Badge>
                ) : (
                    <Badge variant="destructive" className="font-normal">Blacklist</Badge>
                )
            )
        }
    ];

    return (
        <>
            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Perusahaan Mitra</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <div className="h-8 w-16 animate-pulse bg-muted rounded" /> : (
                            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Terdaftar di sistem</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Alumni Magang</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <div className="h-8 w-16 animate-pulse bg-muted rounded" /> : (
                            <div className="text-2xl font-bold">{stats?.totalInterns || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Bulan KP Selesai</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Arsip Laporan</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? <div className="h-8 w-16 animate-pulse bg-muted rounded" /> : (
                            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Laporan dipublikasi</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="reports">Arsip Laporan Akhir</TabsTrigger>
                    <TabsTrigger value="companies">Daftar Perusahaan</TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="mt-0">
                    <div className="pb-4 px-1">
                        <CardTitle className="text-xl">Arsip Laporan Akhir</CardTitle>
                        <CardDescription>Cari laporan akhir dari mahasiswa yang telah menyelesaikan KP</CardDescription>
                    </div>
                    <InternshipTable
                        columns={reportColumns}
                        data={reports}
                        loading={isLoadingReports}
                        total={reports.length}
                        page={1}
                        pageSize={10}
                        onPageChange={() => {}}
                        searchValue={reportSearch}
                        onSearchChange={setReportSearch}
                        emptyText="Tidak ada laporan ditemukan."
                    />
                </TabsContent>

                <TabsContent value="companies" className="mt-0">
                    <div className="pb-4 px-1">
                        <CardTitle className="text-xl">Daftar Perusahaan Mitra</CardTitle>
                        <CardDescription>Cari referensi perusahaan tempat KP beserta statistik alumninya</CardDescription>
                    </div>
                    <InternshipTable
                        columns={companyColumns}
                        data={companies}
                        loading={isLoadingCompanies}
                        total={companies.length}
                        page={1}
                        pageSize={10}
                        onPageChange={() => {}}
                        searchValue={compSearch}
                        onSearchChange={setCompSearch}
                        emptyText="Tidak ada perusahaan ditemukan."
                    />
                </TabsContent>
            </Tabs>
        </>
    );
}
