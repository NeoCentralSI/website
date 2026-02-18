import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useCompanyStats } from '@/hooks/internship/useCompanyStats';
import { getCompanyStatsColumns } from '@/lib/internshipTableColumns';
import { Building2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { type CompanyStatsItem } from '@/services/internship.service';
import { Badge } from '@/components/ui/badge';

export default function AdminCompanyListPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const {
        displayItems,
        total,
        isLoading,
        isFetching,
        q,
        setQ,
        page,
        setPage,
        pageSize,
        setPageSize,
        refetch,
    } = useCompanyStats();

    // Dialog States
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<CompanyStatsItem | null>(null);

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Daftar Perusahaan' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Daftar Perusahaan');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const handleDetail = (item: CompanyStatsItem) => {
        setSelectedCompany(item);
        setIsDetailOpen(true);
    };

    const columns = useMemo(() => getCompanyStatsColumns({
        onDetail: handleDetail,
    }), []);

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h1>Daftar Perusahaan Terdaftar</h1>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-[calc(100vh-280px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data perusahaan..." />
                </div>
            ) : (
                <CustomTable
                    columns={columns as any}
                    data={displayItems}
                    loading={isLoading}
                    isRefreshing={isFetching && !isLoading}
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                    enableColumnFilters
                    searchValue={q}
                    onSearchChange={(v) => {
                        setQ(v);
                        setPage(1);
                    }}
                    emptyText={q ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Belum ada data perusahaan.'}
                    actions={
                        <div className="flex items-center gap-2">
                            <RefreshButton
                                onClick={() => refetch()}
                                isRefreshing={isFetching && !isLoading}
                            />
                        </div>
                    }
                />
            )}

            {/* Dialog Detail */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-500" />
                            Detail Perusahaan
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCompany && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Nama Perusahaan</p>
                                <p className="text-lg font-semibold">{selectedCompany.companyName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Alamat</p>
                                <p className="text-sm border rounded-md p-3 bg-muted/30">{selectedCompany.address || '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                                    <Badge variant={selectedCompany.status === 'blacklist' ? 'destructive' : 'success'} className="uppercase">
                                        {selectedCompany.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Total Mahasiswa Magang</p>
                                    <p className="text-sm font-medium">{selectedCompany.internCount || 0} Mahasiswa</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground italic">
                                    * Data mahasiswa magang dihitung dari jumlah unik mahasiswa yang memiliki riwayat Kerja Praktik di perusahaan ini.
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsDetailOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
