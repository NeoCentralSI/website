import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useCompanyStats } from '@/hooks/internship/useCompanyStats';
import { getCompanyStatsColumns } from '@/lib/internshipTableColumns';
import { Building2, Plus, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { createSekdepCompany, updateSekdepCompany, deleteSekdepCompany, type CompanyStatsItem } from '@/services/internship.service';
import { Badge } from '@/components/ui/badge';

export default function SekdepCompanyListPage() {
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
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<CompanyStatsItem | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        companyName: '',
        companyAddress: '',
        status: 'save'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Kelola Perusahaan' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Kelola Perusahaan');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const handleAdd = () => {
        setFormData({ companyName: '', companyAddress: '', status: 'save' });
        setIsAddOpen(true);
    };

    const handleEdit = (item: CompanyStatsItem) => {
        setSelectedCompany(item);
        setFormData({
            companyName: item.companyName,
            companyAddress: item.address,
            status: item.status
        });
        setIsEditOpen(true);
    };

    const handleDetail = (item: CompanyStatsItem) => {
        setSelectedCompany(item);
        setIsDetailOpen(true);
    };

    const handleDelete = (item: CompanyStatsItem) => {
        setSelectedCompany(item);
        setIsDeleteOpen(true);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createSekdepCompany(formData);
            toast.success('Perusahaan berhasil ditambahkan');
            setIsAddOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menambahkan perusahaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setIsSubmitting(true);
        try {
            await updateSekdepCompany(selectedCompany.id, formData);
            toast.success('Perusahaan berhasil diperbarui');
            setIsEditOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui perusahaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedCompany) return;
        setIsSubmitting(true);
        try {
            await deleteSekdepCompany(selectedCompany.id);
            toast.success('Perusahaan berhasil dihapus');
            setIsDeleteOpen(false);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus perusahaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = useMemo(() => getCompanyStatsColumns({
        onEdit: handleEdit,
        onDetail: handleDetail,
        onDelete: handleDelete
    }), []);

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h1>Daftar Perusahaan Terdaftar</h1>
                </div>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Perusahaan
                </Button>
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
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                    }
                />
            )}

            {/* Dialog Tambah */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmitAdd}>
                        <DialogHeader>
                            <DialogTitle>Tambah Perusahaan</DialogTitle>
                            <DialogDescription>
                                Masukkan detail perusahaan baru di bawah ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Perusahaan</Label>
                                <Input
                                    id="name"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="Contoh: PT. Teknologi Maju"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat Perusahaan</Label>
                                <Textarea
                                    id="address"
                                    value={formData.companyAddress}
                                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                                    placeholder="Masukkan alamat lengkap"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="save">SAVE</SelectItem>
                                        <SelectItem value="blacklist">BLACKLIST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Perusahaan</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi perusahaan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nama Perusahaan</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-address">Alamat Perusahaan</Label>
                                <Textarea
                                    id="edit-address"
                                    value={formData.companyAddress}
                                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="save">SAVE</SelectItem>
                                        <SelectItem value="blacklist">BLACKLIST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Memperbarui...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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

            {/* Dialog Delete Confirm */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Hapus Perusahaan
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus <strong>{selectedCompany?.companyName}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
