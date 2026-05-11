import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getHolidays,
    createHoliday,
    deleteHoliday,
    type InternshipHoliday,
} from "@/services/internship/holiday.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/spinner";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    CalendarDays,
    Plus,
    Trash2,
    CalendarOff,
    Search,
} from "lucide-react";

export default function ManageHolidays() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();

    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [addOpen, setAddOpen] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [newName, setNewName] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<InternshipHoliday | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const breadcrumbs = useMemo(
        () => [
            { label: "Master Data" },
            { label: "Data Hari Libur" },
        ],
        []
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined);
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const {
        data: holidays = [],
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["internship-holidays", selectedYear],
        queryFn: async () => {
            const res = await getHolidays(selectedYear);
            return res.data;
        },
    });

    const filteredHolidays = useMemo(() => {
        if (!searchQuery.trim()) return holidays;
        const q = searchQuery.toLowerCase();
        return holidays.filter(
            (h) =>
                (h.name && h.name.toLowerCase().includes(q)) ||
                formatDate(h.holidayDate).toLowerCase().includes(q)
        );
    }, [holidays, searchQuery]);

    const createMut = useMutation({
        mutationFn: () => createHoliday({ holidayDate: newDate, name: newName || undefined }),
        onSuccess: (res) => {
            toast.success(res.message || "Hari libur berhasil ditambahkan.");
            queryClient.invalidateQueries({ queryKey: ["internship-holidays"] });
            setAddOpen(false);
            setNewDate("");
            setNewName("");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => deleteHoliday(id),
        onSuccess: (res) => {
            toast.success(res.message || "Hari libur berhasil dihapus.");
            queryClient.invalidateQueries({ queryKey: ["internship-holidays"] });
            setDeleteTarget(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const yearOptions = useMemo(() => {
        const curr = new Date().getFullYear();
        return [curr - 1, curr, curr + 1].map(String);
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Manajemen Hari Libur
                </h1>
                <p className="text-muted-foreground text-sm">
                    Kelola daftar hari libur untuk perhitungan hari kerja KP.
                </p>
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Year filter */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Tahun:</Label>
                            <div className="flex gap-1">
                                {yearOptions.map((y) => (
                                    <Button
                                        key={y}
                                        size="sm"
                                        variant={selectedYear === y ? "default" : "outline"}
                                        onClick={() => setSelectedYear(y)}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {y}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Separator orientation="vertical" className="h-6 hidden sm:block" />

                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari hari libur..."
                                className="pl-9 h-8 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <RefreshButton
                                onClick={() => refetch()}
                                isRefreshing={isFetching && !isLoading}
                            />
                            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Tambah Libur
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {isLoading ? (
                <div className="flex h-[calc(100vh-340px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data hari libur..." />
                </div>
            ) : filteredHolidays.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium text-foreground">
                            {searchQuery ? "Tidak ada hasil" : "Belum ada hari libur"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            {searchQuery
                                ? "Coba kata kunci pencarian lain."
                                : `Belum ada hari libur yang terdaftar untuk tahun ${selectedYear}. Klik "Tambah Libur" untuk memulai.`}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                    Daftar Hari Libur {selectedYear}
                                </CardTitle>
                                <CardDescription>
                                    {filteredHolidays.length} hari libur terdaftar
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filteredHolidays.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <CalendarDays className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {h.name || "Hari Libur"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(h.holidayDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px]">
                                            {getDayName(h.holidayDate)}
                                        </Badge>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setDeleteTarget(h)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Hari Libur</DialogTitle>
                        <DialogDescription>
                            Tanggal yang ditambahkan akan dikecualikan dari perhitungan hari kerja KP.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Tanggal <span className="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Keterangan</Label>
                            <Input
                                placeholder="Contoh: Hari Raya Idul Fitri"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setAddOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            disabled={!newDate || createMut.isPending}
                            onClick={() => createMut.mutate()}
                        >
                            {createMut.isPending ? "Menambahkan..." : "Tambah"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Hari Libur</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name || "hari libur ini"}
                            </span>{" "}
                            ({deleteTarget ? formatDate(deleteTarget.holidayDate) : ""})?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteMut.isPending}
                            onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
                        >
                            {deleteMut.isPending ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getDayName(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", { weekday: "long" });
}
