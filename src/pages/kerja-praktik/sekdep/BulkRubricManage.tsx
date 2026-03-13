import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getInternshipCpmkById,
    bulkUpdateInternshipRubrics, 
    type InternshipAssessmentRubric 
} from '@/services/internship.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InternshipTable, type Column } from '@/components/internship/InternshipTable';
import { 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    Info, 
    AlertCircle,
    Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';

// Quill modules configuration
const quillModules = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
    ],
};

const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
];

interface RubricFormItem {
    id: string; // Temporary ID for frontend management
    levelName: string;
    rubricLevelDescription: string;
    minScore: string;
    maxScore: string;
    isNew?: boolean;
}

export default function BulkRubricManage() {
    const { cpmkId } = useParams<{ cpmkId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const [rubrics, setRubrics] = useState<RubricFormItem[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const isEditing = searchParams.get('edit') === 'true';
    
    const setIsEditing = (val: boolean) => {
        setSearchParams(params => {
            const newParams = new URLSearchParams(params);
            if (val) {
                newParams.set('edit', 'true');
            } else {
                newParams.delete('edit');
            }
            return newParams;
        }, { replace: true });
    };

    const rubricColumns: Column<RubricFormItem>[] = [
        {
            key: 'no',
            header: 'No',
            width: 50,
            className: 'text-center',
            render: (_, index) => <span className="font-medium">{index + 1}</span>
        },
        {
            key: 'levelName',
            header: 'Nama Level',
            width: 200,
            render: (row) => isEditing ? (
                <Input 
                    value={row.levelName}
                    placeholder="Sangat Kompeten"
                    onChange={(e) => handleUpdateField(row.id, 'levelName', e.target.value)}
                    className="font-medium"
                />
            ) : (
                <span className="font-bold text-primary">{row.levelName}</span>
            )
        },
        {
            key: 'rubricLevelDescription',
            header: 'Kriteria & Poin Penilaian',
            render: (row) => isEditing ? (
                <div className={cn(
                    "rounded-md border border-input bg-background overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/80"
                )}>
                    <ReactQuill 
                        theme="snow"
                        value={row.rubricLevelDescription}
                        onChange={(content) => handleUpdateField(row.id, 'rubricLevelDescription', content)}
                        modules={quillModules}
                        formats={quillFormats}
                        className="no-border-quill min-h-[120px]"
                    />
                </div>
            ) : (
                <div 
                    className="text-sm leading-relaxed prose prose-sm prose-compact max-w-none rubric-content py-2"
                    dangerouslySetInnerHTML={{ __html: row.rubricLevelDescription }}
                />
            )
        },
        {
            key: 'scoreRange',
            header: 'Range Skor',
            width: 180,
            className: 'text-center',
            render: (row) => isEditing ? (
                <div className="flex items-center gap-2 justify-center">
                    <Input 
                        type="number"
                        className="w-20 text-center"
                        value={row.minScore}
                        onChange={(e) => handleUpdateField(row.id, 'minScore', e.target.value)}
                    />
                    <span>-</span>
                    <Input 
                        type="number"
                        className="w-20 text-center"
                        value={row.maxScore}
                        onChange={(e) => handleUpdateField(row.id, 'maxScore', e.target.value)}
                    />
                </div>
            ) : (
                <Badge variant="secondary" className="font-mono px-2 py-1">
                    {row.minScore} - {row.maxScore}
                </Badge>
            )
        },
        ...(isEditing ? [{
            key: 'actions',
            header: 'Aksi',
            width: 80,
            className: 'text-center',
            render: (row: RubricFormItem) => (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => handleRemoveRow(row.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        }] : [])
    ];

    const { data: currentCpmk, isLoading: isLoadingCpmk } = useQuery({
        queryKey: ['internship-cpmk', cpmkId],
        queryFn: () => getInternshipCpmkById(cpmkId!),
        enabled: !!cpmkId
    });

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Kerja Praktik', href: '/kelola/kerja-praktik' },
            { label: 'Pengelolaan CPMK', href: '/kelola/kerja-praktik/pendaftaran/cpmk' },
            { label: `Rubrik: ${currentCpmk?.code || '...'}` }
        ]);
        setTitle(undefined); // Header will handle the title
    }, [setBreadcrumbs, setTitle, currentCpmk]);

    useEffect(() => {
        if (currentCpmk?.rubrics) {
            setRubrics(currentCpmk.rubrics.map(r => ({
                id: r.id,
                levelName: r.levelName || '',
                rubricLevelDescription: r.rubricLevelDescription,
                minScore: r.minScore.toString(),
                maxScore: r.maxScore.toString()
            })));
        } else if (rubrics.length === 0 && !isLoadingCpmk) {
            // Add initial empty row if no rubrics
            handleAddRow();
        }
    }, [currentCpmk, isLoadingCpmk]);

    const bulkUpdateMutation = useMutation({
        mutationFn: (data: Partial<InternshipAssessmentRubric>[]) => 
            bulkUpdateInternshipRubrics(cpmkId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['internship-cpmks'] });
            toast.success('Berhasil menyimpan rubrik penilaian');
            navigate(-1);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal menyimpan rubrik');
        }
    });

    const handleAddRow = () => {
        setRubrics(prev => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                levelName: '',
                rubricLevelDescription: '',
                minScore: '',
                maxScore: '',
                isNew: true
            }
        ]);
    };

    const handleRemoveRow = (id: string) => {
        setRubrics(prev => prev.filter(r => r.id !== id));
    };

    const handleUpdateField = (id: string, field: keyof RubricFormItem, value: string) => {
        setRubrics(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSave = () => {
        // Validation
        const isValid = rubrics.every(r => 
            r.levelName.trim() !== '' && 
            r.rubricLevelDescription.trim() !== '' && 
            r.minScore !== '' && 
            r.maxScore !== ''
        );

        if (!isValid) {
            toast.error('Mohon lengkapi semua field rubrik');
            return;
        }

        const dataToSave = rubrics.map(r => ({
            levelName: r.levelName,
            rubricLevelDescription: r.rubricLevelDescription,
            minScore: parseFloat(r.minScore),
            maxScore: parseFloat(r.maxScore)
        }));

        bulkUpdateMutation.mutate(dataToSave);
    };

    if (isLoadingCpmk) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!currentCpmk) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-semibold">CPMK tidak ditemukan</h2>
                <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6 mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Atur Rubrik Penilaian</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-mono">{currentCpmk.code}</Badge>
                            <span className="text-muted-foreground text-sm line-clamp-1">{currentCpmk.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Info Card - Only show in edit mode */}
            {isEditing && (
                <Card className="bg-primary/5 border-primary/10 shadow-none animate-in fade-in slide-in-from-top-2">
                    <CardContent className="py-0 px-4 flex gap-3 items-start">
                        <Info className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-sm text-foreground/80 space-y-1">
                            <p className="font-semibold text-primary">Petunjuk Pengisian:</p>
                            <ul className="list-disc list-inside space-y-1 opacity-90">
                                <li><strong>Nama Level:</strong> Contoh: "Sangat Kompeten", "Kompeten", dsb.</li>
                                <li><strong>Deskripsi Rubrik:</strong> Gunakan daftar poin (bullet points) untuk kriteria yang lebih mendalam.</li>
                                <li><strong>Range Skor:</strong> Pastikan range skor antar level tidak tumpang tindih (misal: 0-50, 51-75, 76-100).</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rubrics Content */}
            <div className="space-y-4">
                {rubrics.length === 0 && !isEditing ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl border-muted bg-muted/20">
                        <p className="text-muted-foreground">Belum ada rubrik untuk CPMK ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <InternshipTable 
                            columns={rubricColumns}
                            data={rubrics}
                            total={rubrics.length}
                            page={1}
                            pageSize={isEditing ? 100 : 100} // Keep it large for now if needed, but disable pagination
                            onPageChange={() => {}}
                            rowKey={(row) => row.id}
                            emptyText="Belum ada rubrik untuk CPMK ini"
                            hidePagination={isEditing}
                            actions={
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <Button 
                                            onClick={() => setIsEditing(true)}
                                            className="gap-2"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Edit Rubrik
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-1 px-3">
                                                <Edit3 className="h-3 w-3 mr-1.5" />
                                                Mode Edit Aktif
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            }
                            appendRow={isEditing && (
                                <div className="p-2 transition-all animate-in fade-in slide-in-from-top-1 bg-muted/5 flex justify-center">
                                    <Button 
                                        variant="ghost" 
                                        className=" text-primary hover:bg-primary/10 h-10 px-4 gap-2"
                                        onClick={handleAddRow}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Level Penilaian
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="pb-12 border-t pt-6 flex justify-end items-center text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            disabled={bulkUpdateMutation.isPending}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={bulkUpdateMutation.isPending}
                            className="gap-2 px-6"
                        >
                            {bulkUpdateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </div>
                </div>
            )}
            
            <style>{`
                .ql-container {
                    font-family: inherit;
                    font-size: 0.875rem;
                }
                .ql-editor {
                    min-height: 100px;
                }
                .ql-toolbar.ql-snow {
                    border-top: none;
                    border-left: none;
                    border-right: none;
                    border-bottom: 1px solidhsl(var(--input));
                    background: transparent;
                }
                .read-only-quill .ql-editor {
                    padding: 0;
                    min-height: auto;
                }
                .read-only-quill .ql-container.ql-snow {
                    border: none;
                }
                .rubric-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .rubric-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .rubric-content li {
                    margin-bottom: 0.25rem;
                }
            `}</style>
        </div>
    );
}
