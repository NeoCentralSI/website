import { useState } from "react";
import { useParams } from "react-router-dom";
import { useClassGradingSummary, useLockClassGrades } from "@/hooks/metopen/useMetopenGrading";
import type { MetopenStudentGrading } from "@/services/metopenGrading.service";
import { Calculator, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { RubricGradingForm } from "@/components/metopen/RubricGradingForm";

export default function PenilaianAkhirMetopen() {
    const { classId } = useParams<{ classId: string }>();
    const { data: gradingData, isLoading, refetch } = useClassGradingSummary(classId);
    const lockMutation = useLockClassGrades();
    const [rubricTarget, setRubricTarget] = useState<{ thesisId: string; studentName: string; formCode: "TA-03A" | "TA-03B" } | null>(null);

    const handleLockScores = () => {
        if (confirm("Apakah Anda yakin ingin mengunci nilai akhir metopen untuk kelas ini? Tindakan ini akan menyimpan nilai secara permanen.")) {
            lockMutation.mutate(classId!);
        }
    };

    const isLocked = gradingData?.every((d: MetopenStudentGrading) => d.calculatedAt !== null && d.finalScore !== null);
    const missingSupervisors = gradingData?.filter((d: MetopenStudentGrading) => d.supervisorScore === null).length || 0;

    return (
        <div className="container mx-auto max-w-7xl py-6 space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Calculator className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Penilaian Akhir Metodologi Penelitian</h1>
                    <p className="text-muted-foreground">Rekapitulasi nilai dari tugas pengampu dan evaluasi pembimbing per mahasiswa</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Mahasiswa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gradingData?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu Nilai Pembimbing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{missingSupervisors}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Status Rekapitulasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLocked ? (
                            <Badge variant="default" className="bg-green-600">Selesai & Terkunci</Badge>
                        ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">Proses Penilaian</Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {!isLocked && missingSupervisors > 0 && (
                <Alert variant="destructive" className="bg-amber-50 text-amber-900 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Perhatian</AlertTitle>
                    <AlertDescription>
                        Terdapat {missingSupervisors} mahasiswa yang belum mendapatkan **Nilai Pembimbing**. Anda tetap dapat merilis/lock nilai, namun disarankan menunggu pembimbing memasukkan nilainya agar nilai akhir akurat (70% Pembimbing, 30% Pengampu).
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between space-y-0 gap-4">
                    <div>
                        <CardTitle>Tabel Nilai Kelas</CardTitle>
                        <CardDescription>Detail nilai per mahasiswa di kelas ini</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Segarkan
                        </Button>
                        {!isLocked && (
                            <Button onClick={handleLockScores} disabled={lockMutation.isPending || !gradingData?.length} className="bg-primary hover:bg-primary/90">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Lock & Simpan Nilai Akhir
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">No</TableHead>
                                    <TableHead className="min-w-[200px]">Mahasiswa</TableHead>
                                    <TableHead className="min-w-[200px]">Data Pembimbing</TableHead>
                                    <TableHead className="text-center">Nilai Tugas (Pengampu)</TableHead>
                                    <TableHead className="text-center">Nilai Bimbingan (Pembimbing)</TableHead>
                                    <TableHead className="text-center">Nilai Akhir (70/30)</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center w-[100px]">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">Memuat data grading...</TableCell>
                                    </TableRow>
                                ) : gradingData?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">Tidak ada mahasiswa di kelas ini.</TableCell>
                                    </TableRow>
                                ) : (
                                    gradingData?.map((student: MetopenStudentGrading, idx: number) => {
                                        const estimatedFinal = Math.round(((student.supervisorScore || 0) * 0.7) + (student.lecturerScore * 0.3));
                                        const isPassed = student.isPassed !== null ? student.isPassed : estimatedFinal >= 60;

                                        return (
                                            <TableRow key={student.studentId}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{student.studentName}</div>
                                                    <div className="text-xs text-muted-foreground">{student.studentNim}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs">{student.supervisors}</div>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {student.lecturerScore}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {student.supervisorScore !== null ? (
                                                        <span className="font-medium text-blue-600">{student.supervisorScore}</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Menunggu</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-lg">
                                                    {student.finalScore !== null ? student.finalScore : <span className="text-muted-foreground">~{estimatedFinal}</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {student.finalScore !== null ? (
                                                        <Badge variant={isPassed ? "default" : "destructive"} className={isPassed ? "bg-green-600" : ""}>
                                                            {isPassed ? "LULUS" : "TIDAK LULUS"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">Estimasi: {isPassed ? "LULUS" : "GAGAL"}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {!isLocked && student.thesisId && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setRubricTarget({
                                                                thesisId: student.thesisId,
                                                                studentName: student.studentName,
                                                                formCode: "TA-03B",
                                                            })}
                                                        >
                                                            Rubrik
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!rubricTarget} onOpenChange={(open) => !open && setRubricTarget(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    {rubricTarget && (
                        <RubricGradingForm
                            thesisId={rubricTarget.thesisId}
                            formCode={rubricTarget.formCode}
                            studentName={rubricTarget.studentName}
                            onSuccess={() => {
                                setRubricTarget(null);
                                refetch();
                            }}
                            onCancel={() => setRubricTarget(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
