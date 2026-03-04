import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Loading, Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useStudentSeminarOverview,
  useStudentRevisions,
  useCreateRevision,
  useSubmitRevisionAction,
} from '@/hooks/seminar';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';
import { MessageSquareText, ListChecks, Plus, Send, CheckCircle2, Clock, FileText } from 'lucide-react';

const TABS = [
  { label: 'Seminar Hasil', to: '/tugas-akhir/seminar/student', end: true },
  { label: 'Riwayat Kehadiran', to: '/tugas-akhir/seminar/student/attendance', end: false },
];

export default function StudentSeminarRevision() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar/student' },
      { label: 'Perbaikan Seminar' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data: overview } = useStudentSeminarOverview();
  const { data: revisionData, isLoading } = useStudentRevisions();
  const createMutation = useCreateRevision();
  const submitMutation = useSubmitRevisionAction();

  // Add revision form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [selectedExaminerId, setSelectedExaminerId] = useState('');

  // Submit action state (per revision)
  const [editingRevisionId, setEditingRevisionId] = useState<string | null>(null);
  const [revisionActionText, setRevisionActionText] = useState('');

  const seminarStatus = overview?.seminar?.status;
  const isPassedWithRevision = seminarStatus === 'passed_with_revision';

  // Get examiners from overview for the select dropdown
  const examiners = overview?.seminar?.examiners ?? [];

  const handleCreateRevision = () => {
    if (!selectedExaminerId || !newDescription.trim()) return;
    createMutation.mutate(
      { seminarExaminerId: selectedExaminerId, description: newDescription.trim() },
      {
        onSuccess: () => {
          setNewDescription('');
          setSelectedExaminerId('');
          setShowAddForm(false);
        },
      }
    );
  };

  const handleSubmitAction = (revisionId: string) => {
    if (!revisionActionText.trim()) return;
    submitMutation.mutate(
      { revisionId, payload: { revisionAction: revisionActionText.trim() } },
      {
        onSuccess: () => {
          setEditingRevisionId(null);
          setRevisionActionText('');
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Perbaikan Seminar</h1>
          <p className="text-gray-500">Kelola perbaikan dari hasil seminar</p>
        </div>
      </div>

      <TabsNav tabs={TABS} />

      {!isPassedWithRevision ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Halaman ini hanya tersedia jika seminar berstatus Lulus dengan Revisi.
        </div>
      ) : isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data revisi..." />
        </div>
      ) : revisionData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{revisionData.summary.total}</p>
                  <p className="text-sm text-muted-foreground">Total Perbaikan</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{revisionData.summary.finished}</p>
                  <p className="text-sm text-muted-foreground">Diverifikasi</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{revisionData.summary.pendingApproval}</p>
                  <p className="text-sm text-muted-foreground">Menunggu Verifikasi</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Examiner Notes */}
          {revisionData.examinerNotes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquareText className="h-5 w-5" />
                Catatan Penguji
              </h2>
              {revisionData.examinerNotes.map((note, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Penguji {note.examinerOrder} — {toTitleCaseName(note.lecturerName)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{note.revisionNotes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Revision List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Daftar Perbaikan
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'outline' : 'default'}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Perbaikan
              </Button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Penguji</Label>
                    <Select value={selectedExaminerId} onValueChange={setSelectedExaminerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih penguji" />
                      </SelectTrigger>
                      <SelectContent>
                        {examiners.map((ex) => (
                          <SelectItem key={ex.id} value={ex.id}>
                            Penguji {ex.order}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Saran/Catatan yang Perlu Diperbaiki</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Tuliskan saran atau catatan dari penguji yang perlu diperbaiki..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewDescription('');
                        setSelectedExaminerId('');
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateRevision}
                      disabled={!selectedExaminerId || !newDescription.trim() || createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Menyimpan...
                        </>
                      ) : (
                        'Simpan'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revision items */}
            {revisionData.revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada item perbaikan. Tambahkan perbaikan berdasarkan catatan penguji.</p>
            ) : (
              <div className="space-y-3">
                {revisionData.revisions.map((item, idx) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{idx + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            Penguji {item.examinerOrder ?? '-'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({toTitleCaseName(item.examinerName)})
                          </span>
                        </div>
                        <Badge variant={item.isFinished ? 'success' : item.studentSubmittedAt ? 'warning' : 'secondary'}>
                          {item.isFinished
                            ? 'Diverifikasi'
                            : item.studentSubmittedAt
                              ? 'Menunggu Verifikasi'
                              : 'Belum Diisi'}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Saran/Catatan:</p>
                        <p className="text-sm">{item.description}</p>
                      </div>

                      {/* Revision action display or edit */}
                      {item.isFinished ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Perbaikan Yang Dilakukan:</p>
                          <p className="text-sm">{item.revisionAction || '-'}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Diverifikasi oleh {toTitleCaseName(item.approvedBySupervisorName || '-')} pada {formatDateTimeId(item.supervisorApprovedAt || '')}
                          </p>
                        </div>
                      ) : editingRevisionId === item.id ? (
                        <div className="space-y-2">
                          <Label className="text-xs">Perbaikan Yang Dilakukan</Label>
                          <Textarea
                            value={revisionActionText}
                            onChange={(e) => setRevisionActionText(e.target.value)}
                            placeholder="Jelaskan perbaikan yang telah Anda lakukan..."
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRevisionId(null);
                                setRevisionActionText('');
                              }}
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitAction(item.id)}
                              disabled={!revisionActionText.trim() || submitMutation.isPending}
                            >
                              {submitMutation.isPending ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Mengirim...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" />
                                  Submit
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : item.studentSubmittedAt ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Perbaikan Yang Dilakukan:</p>
                          <p className="text-sm">{item.revisionAction || '-'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Disubmit: {formatDateTimeId(item.studentSubmittedAt)}
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRevisionId(item.id);
                            setRevisionActionText(item.revisionAction || '');
                          }}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Isi Perbaikan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data revisi tidak tersedia.
        </div>
      )}
    </div>
  );
}
