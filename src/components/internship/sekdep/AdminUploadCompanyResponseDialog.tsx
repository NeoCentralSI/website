import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, X } from "lucide-react";

interface AdminUploadCompanyResponseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    companyName: string;
    onConfirm: (file: File) => void;
    isLoading: boolean;
}

export default function AdminUploadCompanyResponseDialog({
    open,
    onOpenChange,
    companyName,
    onConfirm,
    isLoading,
}: AdminUploadCompanyResponseDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            onConfirm(selectedFile);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSelectedFile(null);
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !selectedFile}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload Surat Balasan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
