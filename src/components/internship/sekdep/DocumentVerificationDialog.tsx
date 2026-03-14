import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Upload, XCircle, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface DocumentVerificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (status: 'APPROVED' | 'REVISION_NEEDED', notes?: string, file?: File) => void;
    isLoading?: boolean;
    title: string;
    initialNotes?: string;
    mode: 'APPROVE' | 'REJECT';
    allowFileUpload?: boolean; // New prop to enable file upload
    existingFeedbackFile?: {
        fileName: string;
        filePath: string;
    } | null;
}

const DocumentVerificationDialog: React.FC<DocumentVerificationDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    title,
    initialNotes = '',
    mode,
    allowFileUpload = false,
    existingFeedbackFile = null
}) => {
    const [notes, setNotes] = useState(initialNotes);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setNotes(initialNotes);
            setSelectedFile(null);
        }
    }, [open, initialNotes]);

    const isApprove = mode === 'APPROVE';
    const showFileUpload = allowFileUpload && !isApprove;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                alert('Hanya file PDF yang diperbolehkan');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file maksimal 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleConfirm = () => {
        onConfirm(
            isApprove ? 'APPROVED' : 'REVISION_NEEDED',
            notes || undefined,
            selectedFile || undefined
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isApprove ? 'Setujui' : 'Tolak'} {title}</DialogTitle>
                    <DialogDescription>
                        {isApprove 
                            ? 'Apakah Anda yakin ingin menyetujui dokumen ini?' 
                            : 'Berikan alasan mengapa dokumen ini perlu direvisi.'}
                    </DialogDescription>
                </DialogHeader>

                {!isApprove && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Alasan revisi..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        {showFileUpload && (
                            <div className="grid gap-2">
                                <Label>Upload PDF (Opsional)</Label>
                                
                                {existingFeedbackFile && !selectedFile && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="text-sm truncate">{existingFeedbackFile.fileName}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-2 shrink-0">File sebelumnya</span>
                                    </div>
                                )}

                                {selectedFile ? (
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-sm truncate">{selectedFile.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveFile}
                                            className="shrink-0"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="feedback-file"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {existingFeedbackFile ? 'Ganti File PDF' : 'Pilih File PDF'}
                                        </Button>
                                    </div>
                                )}

                                {existingFeedbackFile && !selectedFile && (
                                    <p className="text-xs text-muted-foreground">
                                        File feedback sebelumnya akan diganti jika Anda mengunggah file baru.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                     <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="sm:mr-auto"
                    >
                        Batal
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!isApprove ? (
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex-1 sm:flex-none"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Tolak
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={handleConfirm}
                                disabled={isLoading}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Setujui
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentVerificationDialog;
