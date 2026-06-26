import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, FileText, X } from "lucide-react";

interface Member {
    id: string;
    name: string;
    nim: string;
    role: string;
    status: string;
}

interface AdminUploadCompanyResponseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyName: string;
    members?: Member[];
    onConfirm: (file: File, acceptedMemberIds: string[]) => void;
    isLoading: boolean;
}

export default function AdminUploadCompanyResponseDialog({
    open,
    onOpenChange,
    companyName,
    members = [],
    onConfirm,
    isLoading,
}: AdminUploadCompanyResponseDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [acceptedMemberIds, setAcceptedMemberIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setAcceptedMemberIds(members.map(member => member.id));
        }
    }, [open, members]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleConfirm = () => {
        if (selectedFile) {
            onConfirm(selectedFile, acceptedMemberIds);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedFile(null);
            setAcceptedMemberIds([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        onOpenChange(isOpen);
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const toggleMember = (studentId: string) => {
        setAcceptedMemberIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const acceptedCount = acceptedMemberIds.length;
    const isRejectedAll = members.length > 0 && acceptedCount === 0;
    const isPartial = members.length > 0 && acceptedCount > 0 && acceptedCount < members.length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Upload Surat Balasan Perusahaan</DialogTitle>
                    <DialogDescription>
                        Upload surat balasan dari <strong>{companyName}</strong> yang diterima langsung oleh departemen.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">File Surat Balasan (PDF)</label>
                        {!selectedFile ? (
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    Klik untuk memilih file PDF
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Maksimal 10MB
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 shrink-0"
                                    onClick={removeFile}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {members.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-sm font-medium">Mahasiswa yang Diterima</label>
                                <span className="text-xs text-muted-foreground">{acceptedCount}/{members.length}</span>
                            </div>
                            <div className="border rounded-md divide-y">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{member.name}</p>
                                            <p className="text-xs text-muted-foreground">{member.nim} - {member.role}</p>
                                        </div>
                                        <Checkbox
                                            checked={acceptedMemberIds.includes(member.id)}
                                            onCheckedChange={() => toggleMember(member.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isRejectedAll
                                    ? "Semua mahasiswa akan ditandai ditolak perusahaan."
                                    : isPartial
                                        ? "Mahasiswa yang tidak dicentang akan ditandai ditolak perusahaan."
                                        : "Semua mahasiswa akan ditandai diterima perusahaan."}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !selectedFile}
                        variant={isRejectedAll ? "destructive" : "default"}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload Surat Balasan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
