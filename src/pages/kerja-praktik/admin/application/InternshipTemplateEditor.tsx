import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
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

const InternshipTemplateEditor = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [templateType, setTemplateType] = useState<"HTML" | "DOCX">("DOCX");
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Upload Dialog State
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Preview States
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Surat Pengantar', path: '/admin/kerja-praktik/surat-pengantar' },
        { label: 'Kelola Template' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined);
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    useEffect(() => {
        if (name) {
            fetchTemplate().then(() => {
                if (name) handlePreview();
            });
        }
    }, [name]);

    // Cleanup preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const res = await getInternshipTemplate(name!);
            setTemplateType(res.data.type || "DOCX");
        } catch (error: any) {
            toast.error(error.message || "Gagal memuat template");
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
            await saveInternshipTemplate(name!, null, templateFile);
            toast.success("Template berhasil disimpan");
            // Refresh to ensure we have the latest
            setTemplateFile(null);
            setIsUploadOpen(false); // Close dialog
            await fetchTemplate();
            await handlePreview();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan template");
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTemplateFile(e.target.files[0]);
            setTemplateType("DOCX"); // Always DOCX now
        }
    };

    const handlePreview = async () => {
        try {
            toast.info("Memuat preview...");
            const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_TEMPLATES.PREVIEW(name!));
            const res = await apiRequest(url, { method: 'GET' });
            if (!res.ok) throw new Error("Gagal memuat preview");

            const blob = await res.blob();
            setPreviewBlob(blob);

            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(blob));

            toast.success("Preview berhasil dimuat");
        } catch (err) {
            toast.error("Gagal membuat preview. Pastikan template sudah diupload.");
            console.error(err);
        }
    };

    const placeholders = [
        { tag: "{nomor_surat}", desc: "Nomor surat pengantar (Contoh: 001/UN27/...)" },
        { tag: "{tanggal_surat}", desc: "Tanggal surat dibuat (Contoh: 16 Februari 2024)" },
        { tag: "{nama_perusahaan}", desc: "Nama perusahaan tujuan" },
        { tag: "{alamat_perusahaan}", desc: "Alamat perusahaan tujuan" },
        { tag: "{tanggal_mulai}", desc: "Tanggal mulai KP" },
        { tag: "{tanggal_selesai}", desc: "Tanggal selesai KP" },
        { tag: "{#mahasiswa} ... {/mahasiswa}", desc: "Looping untuk Tabel. Gunakan tag ini untuk membungkus baris tabel." },
        { tag: "{no}", desc: "Nomor urut (Gunakan di dalam loop)" },
        { tag: "{nama}", desc: "Nama Mahasiswa (Gunakan di dalam loop)" },
        { tag: "{nim}", desc: "NIM Mahasiswa (Gunakan di dalam loop)" },
        { tag: "{prodi}", desc: "Program Studi (Gunakan di dalam loop)" },
        { tag: "{isi_surat}", desc: "Area teks bebas (Optional, jika ingin menyisipkan paragraf tambahan)" },
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Kelola Template Surat</h1>
                        <p className="text-muted-foreground text-sm">Upload file Word (.docx) sebagai template surat.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Preview Panel - WIDER (9 cols) */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                    <Card className="h-full border-none shadow-none">
                        <CardHeader className=" pt-0 flex flex-row items-center justify-between space-y-0">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Preview Template</CardTitle>
                                <CardDescription>
                                    {templateType === "DOCX" ? "Menampilkan file Word (.docx) yang aktif saat ini." : "Belum ada template yang diupload."}
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

                            {previewUrl ? (
                                <div className="border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
                                    <iframe
                                        title="Template Preview"
                                        src={previewUrl}
                                        className="w-full bg-gray-100/50"
                                        style={{ height: 'calc(100vh - 300px)', minHeight: '600px', border: 'none' }}
                                    />
                                </div>
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
                                Daftar tag yang bisa digunakan.
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


export default InternshipTemplateEditor;
