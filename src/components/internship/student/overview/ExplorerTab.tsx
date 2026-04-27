import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOverviewStats, getOverviewCompanies, getOverviewReports } from "@/services/internship.service";
import { Loading } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building2, Users, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateId } from "@/lib/text";

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

            <Tabs defaultValue="reports" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="reports">Arsip Laporan Akhir</TabsTrigger>
                    <TabsTrigger value="companies">Daftar Perusahaan</TabsTrigger>
                </TabsList>

                <TabsContent value="reports">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Arsip Laporan Akhir</CardTitle>
                                    <CardDescription>Cari laporan akhir dari mahasiswa yang telah menyelesaikan KP</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 max-w-sm w-full">
                                    <div className="relative w-full">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Cari judul, nama, atau perusahaan..."
                                            className="pl-8"
                                            value={reportSearch}
                                            onChange={(e) => setReportSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoadingReports ? (
                                <div className="flex justify-center p-8"><Loading /></div>
                            ) : reports.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Tidak ada laporan ditemukan.</div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Judul Laporan</TableHead>
                                                <TableHead>Mahasiswa</TableHead>
                                                <TableHead>Perusahaan</TableHead>
                                                <TableHead className="w-[120px]">Tahun</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell className="font-medium max-w-[300px]">
                                                        {report.reportTitle}
                                                        {report.uploadedAt && (
                                                            <p className="text-xs text-muted-foreground font-normal mt-1 flex items-center">
                                                                <Clock className="w-3 h-3 mr-1 inline" /> {formatDateId(new Date(report.uploadedAt))}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>{report.studentName}</div>
                                                        <div className="text-xs text-muted-foreground">{report.nim}</div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{report.companyName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="whitespace-nowrap font-normal">
                                                            {report.academicYear || "-"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="companies">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Daftar Perusahaan Mitra</CardTitle>
                                    <CardDescription>Cari referensi perusahaan tempat KP beserta statistik alumninya</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 max-w-sm w-full">
                                    <div className="relative w-full">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Cari nama perusahaan..."
                                            className="pl-8"
                                            value={compSearch}
                                            onChange={(e) => setCompSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {isLoadingCompanies ? (
                                <div className="flex justify-center p-8"><Loading /></div>
                            ) : companies.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">Tidak ada perusahaan ditemukan.</div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Nama Perusahaan</TableHead>
                                                <TableHead>Alamat</TableHead>
                                                <TableHead className="text-center">Alumni</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {companies.map((company) => (
                                                <TableRow key={company.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                            {company.companyName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate" title={company.companyAddress}>
                                                        {company.companyAddress}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary" className="px-2 font-medium">
                                                            {company.internCount} Mahasiswa
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {company.status === 'save' ? (
                                                            <Badge className="bg-green-600 hover:bg-green-700 font-normal">Tersimpan</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="font-normal">Blacklist</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
