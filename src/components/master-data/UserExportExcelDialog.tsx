import { useState } from "react";
import * as xlsx from "xlsx";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getUsersAPI } from "@/services/admin.service";
import { ROLES } from "@/lib/roles";

interface UserExportExcelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ROLES = [
    { id: ROLES.MAHASISWA, label: "Mahasiswa" },
    { id: ROLES.PEMBIMBING_1, label: "Dosen Saja (Pembimbing)" },
    { id: ROLES.ADMIN, label: "Admin" },
];

const VERIFICATION_STATUSES = [
    { id: "verified", label: "Terverifikasi" },
    { id: "unverified", label: "Belum Verifikasi" },
];

export function UserExportExcelDialog({ open, onOpenChange }: UserExportExcelDialogProps) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedVerificationStatuses, setSelectedVerificationStatuses] = useState<string[]>([]);
    const [enrollmentYear, setEnrollmentYear] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            // Fetch ALL data, local filtering applied later
            const response = await getUsersAPI({
                pageSize: 0,
            });

            const allUsers = response.users || [];

            let filteredUsers = allUsers;

            if (selectedRoles.length > 0) {
                filteredUsers = filteredUsers.filter(u =>
                    u.roles.some((r: any) => selectedRoles.includes(r.name))
                );
            }

            if (selectedVerificationStatuses.length > 0) {
                filteredUsers = filteredUsers.filter(u => {
                    const status = u.isVerified ? "verified" : "unverified";
                    return selectedVerificationStatuses.includes(status);
                });
            }

            if (enrollmentYear && (selectedRoles.length === 0 || selectedRoles.includes(ROLES.MAHASISWA))) {
                filteredUsers = filteredUsers.filter(u => {
                    const year = (u as any).student?.enrollmentYear;
                    return year && String(year) === enrollmentYear;
                });
            }

            if (filteredUsers.length === 0) {
                toast.error("Tidak ada data untuk diexport dengan filter tersebut.");
                return;
            }

            const excelData = filteredUsers.map((user, index) => ({
                "No": index + 1,
                "Nama Lengkap": user.fullName || "-",
                "Email": user.email || "-",
                "NIM/NIP": user.identityNumber || "-",
                "Tipe Identitas": user.identityType || "-",
                "Role": user.roles.map((r: any) => r.name).join(", "),
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

            const yearSuffix = enrollmentYear ? `_${enrollmentYear}` : "";
            xlsx.writeFile(workbook, `Data_User${yearSuffix}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
            onOpenChange(false);
            toast.success(`Berhasil mengeksport ${filteredUsers.length} data user.`);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data untuk export.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRole = (id: string) => {
        setSelectedRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const toggleVerificationStatus = (id: string) => {
        setSelectedVerificationStatuses(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Export Data User</DialogTitle>
                    <DialogDescription>Pilih filter data yang ingin diexport ke Excel.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {/* Roles */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Role User</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs py-1"
                                    onClick={() => setSelectedRoles([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {AVAILABLE_ROLES.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={selectedRoles.includes(role.id)}
                                            onCheckedChange={() => toggleRole(role.id)}
                                            disabled={isLoading}
                                        />
                                        <Label
                                            htmlFor={`role-${role.id}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
                                            {role.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedRoles.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                    Kosongkan untuk menyertakan semua role.
                                </p>
                            )}
                        </div>

                        {/* Verification Status */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Status Verifikasi</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs py-1"
                                    onClick={() => setSelectedVerificationStatuses([])}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {VERIFICATION_STATUSES.map((status) => (
                                    <div key={status.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`status-${status.id}`}
                                            checked={selectedVerificationStatuses.includes(status.id)}
                                            onCheckedChange={() => toggleVerificationStatus(status.id)}
                                            disabled={isLoading}
                                        />
                                        <Label
                                            htmlFor={`status-${status.id}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
                                            {status.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedVerificationStatuses.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">
                                    Kosongkan untuk menyertakan semua status.
                                </p>
                            )}
                        </div>

                        {/* Enrollment Year */}
                        {(selectedRoles.length === 0 || selectedRoles.includes(ROLES.MAHASISWA)) && (
                            <div className="space-y-3 border-t pt-4">
                                <Label className="text-base font-semibold">Angkatan Mahasiswa (Opsional)</Label>
                                <Input
                                    type="number"
                                    placeholder="Contoh: 2020"
                                    value={enrollmentYear}
                                    onChange={(e) => setEnrollmentYear(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Hanya berlaku untuk filter yang menyertakan Role Mahasiswa.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4 border-t pt-4">
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
