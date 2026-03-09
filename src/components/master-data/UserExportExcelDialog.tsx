import { useState } from "react";
import * as xlsx from "xlsx";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersAPI } from "@/services/admin.service";
import { ROLES } from "@/lib/roles";

interface UserExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserExportExcelDialog({ open, onOpenChange }: UserExportExcelDialogProps) {
    const [roleFilter, setRoleFilter] = useState("all");
    const [enrollmentYear, setEnrollmentYear] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL data matching filters (pageSize=0 bypasses pagination)
            const response = await getUsersAPI({
                pageSize: 0,
                role: roleFilter === "all" ? undefined : roleFilter,
                enrollmentYear: roleFilter === ROLES.MAHASISWA || roleFilter === "all" ? enrollmentYear : undefined
            });

            const allUsers = response.users;

            if (allUsers.length === 0) {
                toast.error("Tidak ada data untuk diexport dengan filter tersebut.");
                return;
            }

            const excelData = allUsers.map((user, index) => ({
                "No": index + 1,
                "Nama Lengkap": user.fullName || "-",
                "Email": user.email || "-",
                "NIM/NIP": user.identityNumber || "-",
                "Tipe Identitas": user.identityType || "-",
                "Role": user.roles.map(r => r.name).join(", "),
                "Status Verifikasi": user.isVerified ? "Terverifikasi" : "Belum Verifikasi",
                "Angkatan": (user as any).student?.enrollmentYear ?? "-",
                "Dibuat": user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "-"
            }));

            const worksheet = xlsx.utils.json_to_sheet(excelData);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "Data User");

            const colWidths = [
                { wch: 5 },
                { wch: 30 },
                { wch: 30 },
                { wch: 20 },
                { wch: 15 },
                { wch: 40 },
                { wch: 20 },
                { wch: 10 },
                { wch: 15 },
            ];
            worksheet["!cols"] = colWidths;

            const filenameSuffix = roleFilter === "all" ? "Semua" : roleFilter;
            const yearSuffix = enrollmentYear ? `_${enrollmentYear}` : "";
            xlsx.writeFile(workbook, `Data_User_${filenameSuffix}${yearSuffix}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
            onOpenChange(false);
            toast.success(`Berhasil mengeksport ${allUsers.length} data user.`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data untuk export.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Data User</DialogTitle>
                    <DialogDescription>Pilih kategori user yang ingin diexport ke Excel.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Pilih Role</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Pilih role..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua User</SelectItem>
                                <SelectItem value={ROLES.MAHASISWA}>Mahasiswa Saja</SelectItem>
                                <SelectItem value={ROLES.PEMBIMBING_1}>Dosen Saja (Pembimbing)</SelectItem>
                                <SelectItem value={ROLES.ADMIN}>Admin Saja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {(roleFilter === "all" || roleFilter === ROLES.MAHASISWA) && (
                        <div className="grid gap-2">
                            <Label>Angkatan (Opsional)</Label>
                            <Input
                                type="number"
                                placeholder="Contoh: 2020"
                                value={enrollmentYear}
                                onChange={(e) => setEnrollmentYear(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
                    <Button onClick={handleExport} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Download Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
