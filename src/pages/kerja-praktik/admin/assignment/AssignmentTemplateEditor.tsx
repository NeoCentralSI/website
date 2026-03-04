import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInternshipTemplate, saveInternshipTemplate } from "@/services/internship.service";
import { toast } from "sonner";
import { Loader2, Info, ArrowLeft, Save, FileText, FileUp } from "lucide-react";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Input } from "@/components/ui/input";
import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "@/services/auth.service";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import DocxViewer from "@/components/pdf/DocxViewer";

import type { InternshipTemplate } from "@/services/internship.service";

const AssignmentTemplateEditor = () => {
    const templateName = "INTERNSHIP_ASSIGNMENT_LETTER";
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [template, setTemplate] = useState<InternshipTemplate | null>(null);
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Upload Dialog State
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Preview States - Using Blob URL for authenticated access
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Surat Tugas', path: '/admin/kerja-praktik/surat-tugas' },
        { label: 'Kelola Template' }
    ], []);

    const backPath = '/admin/kerja-praktik/surat-tugas';

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined);
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    useEffect(() => {
        fetchTemplate();
    }, []);

    // Cleanup preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const res = await getInternshipTemplate(templateName).catch(err => {
                // If 404, it means no template has been uploaded yet
                if (err.message?.includes("404") || err.message?.includes("not found")) {
                    return { data: null };
                }
                throw err;
            });

            setTemplate(res.data);

            if (res.data) {
                // Only fetch preview if template exists
                const previewRes = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_TEMPLATES.PREVIEW(templateName)));
                if (previewRes.ok) {
                    const blob = await previewRes.blob();
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                    });
                }
            } else {
                setPreviewUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
            }
        } catch (error: any) {
            console.error("Failed to fetch template:", error);
            // Only show toast for non-404 errors
            if (!error.message?.includes("404") && !error.message?.includes("not found")) {
                toast.error(error.message || "Gagal memuat template");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!templateFile) {
            toast.error("Silakan pilih file template (.docx) terlebih dahulu");
            return;
        }

        try {
            setSaving(true);
            await saveInternshipTemplate(templateName, null, templateFile);
            toast.success("Template berhasil disimpan");

            setTemplateFile(null);
            setIsUploadOpen(false); // Close dialog
            await fetchTemplate(); // This will also refresh the preview blob
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan template");
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTemplateFile(e.target.files[0]);
        }
    };

    const placeholders = [
        { tag: "{nomor_surat}", desc: "Nomor surat tugas (Contoh: 001/UN27/...)" },
        { tag: "{tanggal_surat}", desc: "Tanggal surat dibuat (Contoh: 16 Februari 2024)" },
        { tag: "{nama_perusahaan}", desc: "Nama perusahaan tempat KP" },
        { tag: "{alamat_perusahaan}", desc: "Alamat perusahaan tempat KP" },
        { tag: "{tanggal_mulai}", desc: "Tanggal mulai pelaksanaan magang" },
        { tag: "{tanggal_selesai}", desc: "Tanggal selesai pelaksanaan magang" },
        { tag: "{#m} ... {/m}", desc: "Looping untuk Tabel Mahasiswa (Gunakan tag ini untuk membungkus baris tabel)." },
        { tag: "{no}", desc: "Nomor urut (Gunakan di dalam loop)" },
        { tag: "{nim}", desc: "NIM Mahasiswa (Gunakan di dalam loop)" },
        { tag: "{nama}", desc: "Nama Mahasiswa (Gunakan di dalam loop)" },
        { tag: "{prodi}", desc: "Program Studi (Gunakan di dalam loop)" },
    ];

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat template...</span>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate(backPath)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kelola Template Surat Tugas</h1>
                        <p className="text-muted-foreground text-sm">Upload file Word (.docx) sebagai template Surat Tugas.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Preview Panel - WIDER (9 cols) */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <Card className="h-full border">
                        <CardHeader className=" pt-0 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Preview Template</CardTitle>
                                <CardDescription>
                                    {template ? `Menampilkan file Word (.docx) yang aktif saat ini.` : "Belum ada template yang diupload."}
                                </CardDescription>
                            </div>

                            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <FileUp className="mr-2 h-4 w-4" />
                                        Upload Template
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Upload Template Baru</DialogTitle>
                                        <DialogDescription>
                                            Upload file .docx untuk menggantikan template saat ini.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/20 transition-colors">
                                            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="font-medium mb-1">Pilih File Word</h3>
                                            <p className="text-xs text-muted-foreground mb-4">Maksimal 5MB. Hanya file .docx</p>
                                            <Input
                                                id="template-file"
                                                type="file"
                                                accept=".docx"
                                                onChange={handleFileChange}
                                                className="max-w-xs mx-auto text-sm"
                                            />
                                            {templateFile && (
                                                <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded text-sm flex items-center justify-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    {templateFile.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Batal</Button>
                                        <Button onClick={handleSave} disabled={saving || !templateFile}>
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Simpan Template
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="px-0 relative">

                            {(template && template.filePath) ? (
                                <DocxViewer
                                    url={previewUrl || ""}
                                    style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
                                />
                            ) : (
                                <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                                    <FileText className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Preview tidak tersedia.</p>
                                    <p className="text-sm">Silakan upload template terlebih dahulu.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Panduan Data - NARROWER (3 cols) */}
                <div className="col-span-12 lg:col-span-5">
                    <Card className="h-fit sticky top-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Cheat Sheet
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Daftar tag yang bisa digunakan dalam template.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-none border-t border-b overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="p-2 pl-4">Tag</th>
                                            <th className="p-2 pr-4">Deskripsi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {placeholders.map((p, i) => (
                                            <tr key={i} className="hover:bg-muted/30 group transition-colors">
                                                <td className="p-2 pl-4 font-mono text-blue-600 font-bold break-all group-hover:text-blue-700">
                                                    {p.tag}
                                                </td>
                                                <td className="p-2 pr-4 text-muted-foreground leading-snug">
                                                    {p.desc}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AssignmentTemplateEditor;
