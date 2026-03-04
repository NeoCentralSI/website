import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loading } from '@/components/ui/spinner';
import { useStudentSeminarAssessment } from '@/hooks/seminar';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';

const FINAL_RECOMMENDATIONS = [
  { value: 'passed', label: 'Lulus' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi' },
  { value: 'failed', label: 'Gagal' },
] as const;

interface StudentPenilaianTabProps {
  seminarId: string;
  seminarStatus: string;
}

export function StudentPenilaianTab({ seminarId, seminarStatus }: StudentPenilaianTabProps) {
  const { data, isLoading } = useStudentSeminarAssessment(seminarId);
  const [expandedExaminers, setExpandedExaminers] = useState<Record<string, boolean>>({});

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat data penilaian..." />
      </div>
    );
  }

  const isFinalized = !!data.seminar.resultFinalizedAt;
  const displayGrade = data.averageGrade || data.seminar.grade;
  const averageScoreText = data.averageScore?.toFixed(2) ?? '-';

  const toggleExaminer = (id: string) => {
    setExpandedExaminers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Penilaian Penguji</h2>

      {isFinalized && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Hasil seminar sudah ditetapkan pada {formatDateTimeId(data.seminar.resultFinalizedAt!)}.
        </div>
      )}

      {/* Examiner Cards with per-criteria details */}
      {data.examiners.map((examiner) => {
        const isExpanded = expandedExaminers[examiner.id] ?? false;
        const hasDetails = (examiner.assessmentDetails ?? []).length > 0;
        return (
          <Card key={examiner.id}>
            <CardContent className="pt-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName)}
                </p>
                <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                  {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                </Badge>
              </div>

              {/* Total Score */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Skor:</span>
                <span className="font-semibold text-base">{examiner.assessmentScore ?? '-'}</span>
              </div>

              {examiner.assessmentSubmittedAt && (
                <p className="text-xs text-muted-foreground">
                  Disubmit: {formatDateTimeId(examiner.assessmentSubmittedAt)}
                </p>
              )}

              {/* Per-criteria expandable */}
              {hasDetails && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleExaminer(examiner.id)}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {isExpanded ? 'Sembunyikan detail penilaian' : 'Lihat detail penilaian per kriteria'}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-3">
                      {examiner.assessmentDetails!.map((group) => (
                        <div key={group.id} className="rounded-md border bg-muted/30 overflow-hidden">
                          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            {group.code} — {group.description}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Kriteria</th>
                                <th className="px-3 py-1.5 text-right font-medium text-muted-foreground w-24">Skor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.criteria.map((c) => (
                                <tr key={c.id} className="border-b last:border-0">
                                  <td className="px-3 py-1.5">{c.name}</td>
                                  <td className="px-3 py-1.5 text-right font-medium">
                                    {c.score} / {c.maxScore}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Average Score */}
      <Card className="bg-muted/20">
        <CardContent className="pt-4 flex items-center justify-between">
          <span className="font-medium">Rata-rata Nilai Penguji</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{averageScoreText}</span>
            {displayGrade && <span className="text-lg font-semibold">({displayGrade})</span>}
          </div>
        </CardContent>
      </Card>

      {/* Final Recommendation (read-only) */}
      {isFinalized && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Keputusan Akhir</h3>
          {FINAL_RECOMMENDATIONS.map((item) => {
            const isSelected = seminarStatus === item.value;
            return (
              <div
                key={item.value}
                className={`flex items-center gap-3 rounded-lg border p-3 ${isSelected ? 'border-green-300 bg-green-50' : 'opacity-50'}`}
              >
                {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                <p className={`font-medium text-sm ${isSelected ? 'text-green-700' : ''}`}>{item.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
