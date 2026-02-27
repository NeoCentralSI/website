import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomTable from "@/components/layout/CustomTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getScienceGroupsAPI, createScienceGroupAPI, updateScienceGroupAPI, deleteScienceGroupAPI, type ScienceGroup } from "@/services/admin.service";
import { toast } from "sonner";
import { Loading } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ScienceGroupPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ScienceGroup | null>(null);
    const [formData, setFormData] = useState({ name: "" });

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState<ScienceGroup | null>(null);

    const { data: qData, isLoading } = useQuery({
        queryKey: ["science-groups"],
        queryFn: getScienceGroupsAPI,
    });

    const createMutation = useMutation({
        mutationFn: createScienceGroupAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["science-groups"] });
            toast.success("Kelompok keilmuan berhasil ditambahkan");
            setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string } }) => updateScienceGroupAPI(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["science-groups"] });
            toast.success("Kelompok keilmuan berhasil diperbarui");
            setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteScienceGroupAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["science-groups"] });
            toast.success("Kelompok keilmuan berhasil dihapus");
            setIsDeleteDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
    });

    const filteredData = (qData?.data || []).filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenDialog = (group?: ScienceGroup) => {
        if (group) {
            setEditingGroup(group);
            setFormData({ name: group.name });
        } else {
            setEditingGroup(null);
            setFormData({ name: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (editingGroup) {
            updateMutation.mutate({ id: editingGroup.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const confirmDelete = (group: ScienceGroup) => {
        setDeletingGroup(group);
        setIsDeleteDialogOpen(true);
    };

    if (isLoading) return <Loading />;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Kelola Kelompok Keilmuan</h1>
                    <p className="text-gray-500">Kelola data referensi kelompok keilmuan dosen</p>
                </div>
            </div>

            <CustomTable
                columns={[
                    {
                        key: "index",
                        header: "No",
                        render: (_: any, index: number) => index + 1,
                    },
                    {
                        key: "name",
                        header: "Nama Kelompok Keilmuan",
                        render: (row: ScienceGroup) => <span className="font-medium">{row.name}</span>,
                    },
                    {
                        key: "createdAt",
                        header: "Tanggal Dibuat",
                        render: (row: ScienceGroup) => format(new Date(row.createdAt), "dd MMM yyyy", { locale: idLocale }),
                    },
                    {
                        key: "actions",
                        header: "Aksi",
                        render: (item: ScienceGroup) => (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDialog(item)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => confirmDelete(item)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ),
                    },
                ]}
                data={filteredData}
                loading={isLoading}
                onPageChange={() => { }}
                onPageSizeChange={() => { }}
                searchValue={search}
                onSearchChange={setSearch}
                page={1}
                pageSize={100}
                total={filteredData.length}
                actions={
                    <Button onClick={() => handleOpenDialog()} className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Baru
                    </Button>
                }
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingGroup ? 'Edit' : 'Tambah'} Kelompok Keilmuan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nama Kelompok Keilmuan</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ name: e.target.value })}
                                    placeholder="Contoh: Rekayasa Perangkat Lunak"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kelompok Keilmuan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kelompok keilmuan <strong>{deletingGroup?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingGroup && deleteMutation.mutate(deletingGroup.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
