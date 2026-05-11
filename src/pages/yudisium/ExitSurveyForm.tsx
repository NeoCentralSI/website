import { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { 
  ArrowLeft, 
  PenTool,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getExitSurveyFormById,
  updateExitSurveyForm,
  createExitSurveySession,
  updateExitSurveySession,
  deleteExitSurveySession,
  createExitSurveyQuestion,
  updateExitSurveyQuestion,
  deleteExitSurveyQuestion,
} from '@/services/yudisium/yudisium-exit-survey.service';

import type { 
  UpdateExitSurveyFormPayload,
  CreateExitSurveySessionPayload,
  UpdateExitSurveySessionPayload,
  CreateExitSurveyQuestionPayload,
  UpdateExitSurveyQuestionPayload
} from '@/types/exit-survey.types';

// New Modular Panel Components
import ExitSurveyFormEditorPanel from '@/components/yudisium/ExitSurveyFormEditorPanel';
import ExitSurveyFormPreviewPanel from '@/components/yudisium/ExitSurveyFormPreviewPanel';
import ExitSurveyFormResponsePanel from '@/components/yudisium/ExitSurveyFormResponsePanel';

export default function ExitSurveyFormPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const formId = id!;
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reordering states
  const [reorderMode, setReorderMode] = useState<'none' | 'sessions' | 'questions'>('none');
  const [orderedSessions, setOrderedSessions] = useState<any[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hasReordered, setHasReordered] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [activePanel, setActivePanel] = useState<'editor' | 'preview' | 'responses'>('editor');

  // Deletion confirmation states
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; name: string } | null>(null);

  // Local states for identity
  const [localFormName, setLocalFormName] = useState('');
  const [localFormDesc, setLocalFormDesc] = useState('');
  const [isIdentityDirty, setIsIdentityDirty] = useState(false);
  const formDescRef = useRef<HTMLTextAreaElement>(null);

  const { data: form, isLoading } = useQuery({
    queryKey: ['exit-survey', 'form', formId],
    queryFn: () => getExitSurveyFormById(formId),
    enabled: !!formId,
  });

  useEffect(() => {
    if (form) {
      if (reorderMode === 'none') {
        // Sort sessions by order
        const sortedSessions = [...(form.sessions ?? [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // For each session, sort questions by orderNumber immutably
        const processed = sortedSessions.map(session => ({
          ...session,
          questions: session.questions 
            ? [...session.questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
            : []
        }));
        setOrderedSessions(processed);
      }
      
      // Sync identity
      setLocalFormName(form.name);
      setLocalFormDesc(form.description || '');
      setIsIdentityDirty(false);
    }
  }, [form, reorderMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formDescRef.current) {
        formDescRef.current.style.height = 'auto';
        formDescRef.current.style.height = `${formDescRef.current.scrollHeight}px`;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [localFormDesc]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Exit Survey', href: '/yudisium?tab=exit-survey' },
      { label: 'Kelola Form' },
    ]);
    if (form) {
      setTitle(`Kelola: ${form.name}`);
    }
  }, [setBreadcrumbs, setTitle, form]);

  // Setup Intersection Observer to track active session
  useEffect(() => {
    if (!form?.sessions || activePanel !== 'editor') return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSessionId(entry.target.id.replace('session-', ''));
          }
        });
      },
      {
        rootMargin: '-10% 0% -80% 0%',
        threshold: 0
      }
    );

    form.sessions.forEach((session: any) => {
      const element = document.getElementById(`session-${session.id}`);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => observerRef.current?.disconnect();
  }, [form?.sessions, activePanel]);

  // Mutations
  const updateFormMutation = useMutation({
    mutationFn: (data: UpdateExitSurveyFormPayload) => updateExitSurveyForm(formId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: CreateExitSurveySessionPayload) => createExitSurveySession(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] });
      toast.success('Bagian baru berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ sId, data }: { sId: string; data: UpdateExitSurveySessionPayload }) =>
      updateExitSurveySession(formId, sId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sId: string) => deleteExitSurveySession(formId, sId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] });
      toast.success('Bagian berhasil dihapus');
    },
    onError: (e: Error) => {
      console.error('[Frontend] Delete Session Error:', e);
      toast.error(`Gagal menghapus bagian: ${e.message}`);
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: CreateExitSurveyQuestionPayload) => createExitSurveyQuestion(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] });
      toast.success('Pertanyaan berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ qId, data }: { qId: string; data: UpdateExitSurveyQuestionPayload }) =>
      updateExitSurveyQuestion(formId, qId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (qId: string) => deleteExitSurveyQuestion(formId, qId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] });
      toast.success('Pertanyaan berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Reordering handlers
  const handleSessionDragStart = (id: string) => {
    if (reorderMode !== 'sessions') return;
    setDraggingId(id);
  };

  const handleSessionDragOver = (e: React.DragEvent, targetId: string) => {
    if (reorderMode !== 'sessions') return;
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setOrderedSessions((prev) => {
      const next = [...prev];
      const curIdx = next.findIndex(s => s.id === draggingId);
      const targetIdx = next.findIndex(s => s.id === targetId);
      if (curIdx === -1 || targetIdx === -1) return prev;
      const [moved] = next.splice(curIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
    setHasReordered(true);
  };

  const handleQuestionDragStart = (id: string) => {
    if (reorderMode !== 'questions') return;
    setDraggingId(id);
  };

  const handleQuestionDragOver = (e: React.DragEvent, targetId: string, sessionId: string) => {
    if (reorderMode !== 'questions') return;
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    setOrderedSessions((prev) => {
      const next = [...prev];
      const sIdx = next.findIndex(s => s.id === sessionId);
      if (sIdx === -1) return prev;
      
      const session = { ...next[sIdx] };
      const questions = [...(session.questions || [])];
      const curIdx = questions.findIndex(q => q.id === draggingId);
      const targetIdx = questions.findIndex(q => q.id === targetId);
      
      if (curIdx === -1 || targetIdx === -1) return prev;
      
      const [moved] = questions.splice(curIdx, 1);
      questions.splice(targetIdx, 0, moved);
      
      session.questions = questions;
      next[sIdx] = session;
      return next;
    });
    setHasReordered(true);
  };

  const handleSaveOrder = async () => {
    if (!hasReordered) return;
    setIsSavingOrder(true);
    try {
      if (reorderMode === 'sessions') {
        await Promise.all(
          orderedSessions.map((s, idx) => {
            if (s.order === idx + 1) return Promise.resolve();
            return updateSessionMutation.mutateAsync({ sId: s.id, data: { order: idx + 1 } });
          })
        );
      } else if (reorderMode === 'questions') {
        const mutations: any[] = [];
        orderedSessions.forEach(session => {
          session.questions?.forEach((q: any, idx: number) => {
            if (q.orderNumber === idx + 1) return;
            mutations.push(updateQuestionMutation.mutateAsync({ qId: q.id, data: { orderNumber: idx + 1 } }));
          });
        });
        await Promise.all(mutations);
      }
      toast.success('Urutan berhasil disimpan');
      setHasReordered(false);
      setReorderMode('none');
    } catch {
      toast.error('Gagal menyimpan urutan');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const scrollToElement = (id: string, offset = 100) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loading size="lg" text="Memuat data form..." />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Formulir Exit Survey</h1>
            <p className="text-muted-foreground text-sm">
              Kelola formulir exit survey mahasiswa
            </p>
          </div>
        </div>

        {/* Panel Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
           <Button 
             variant="ghost" 
             size="sm" 
             className={cn(
               "h-9 gap-2 px-5 rounded-lg font-semibold transition-all",
               activePanel === 'editor' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-gray-50"
             )}
             onClick={() => setActivePanel('editor')}
           >
              <PenTool className="h-4 w-4" />
              Edit
           </Button>
           <div className="w-[1px] h-4 bg-gray-200 mx-1" />
           <Button 
             variant="ghost" 
             size="sm" 
             className={cn(
               "h-9 gap-2 px-5 rounded-lg font-semibold transition-all",
               activePanel === 'preview' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-gray-50"
             )}
             onClick={() => setActivePanel('preview')}
           >
              <Eye className="h-4 w-4" />
              Preview
           </Button>
           <div className="w-[1px] h-4 bg-gray-200 mx-1" />
           <Button 
             variant="ghost" 
             size="sm" 
             className={cn(
               "h-9 gap-2 px-5 rounded-lg font-semibold transition-all",
               activePanel === 'responses' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-gray-50"
             )}
             onClick={() => setActivePanel('responses')}
           >
              <MessageSquare className="h-4 w-4" />
              <span>Respons</span>
              <Badge 
                className={cn(
                  "ml-1 px-1.5 py-0 min-w-[20px] h-5 justify-center text-[10px] font-bold border-none",
                  activePanel === 'responses' ? "bg-white text-primary" : "bg-primary text-white"
                )}
              >
                {form.usedCount || 0}
              </Badge>
           </Button>
        </div>
      </div>

      <Separator />

      <div className="max-w-[1600px] mx-auto w-full">
        {activePanel === 'editor' && (
          <ExitSurveyFormEditorPanel 
            form={form}
            reorderMode={reorderMode}
            setReorderMode={setReorderMode}
            orderedSessions={orderedSessions}
            setOrderedSessions={setOrderedSessions}
            draggingId={draggingId}
            setDraggingId={setDraggingId}
            hasReordered={hasReordered}
            setHasReordered={setHasReordered}
            isSavingOrder={isSavingOrder}
            handleSaveOrder={handleSaveOrder}
            activeSessionId={activeSessionId}
            localFormName={localFormName}
            setLocalFormName={setLocalFormName}
            localFormDesc={localFormDesc}
            setLocalFormDesc={setLocalFormDesc}
            isIdentityDirty={isIdentityDirty}
            setIsIdentityDirty={setIsIdentityDirty}
            formDescRef={formDescRef}
            updateFormMutation={updateFormMutation}
            createSessionMutation={createSessionMutation}
            updateSessionMutation={updateSessionMutation}
            createQuestionMutation={createQuestionMutation}
            updateQuestionMutation={updateQuestionMutation}
            setSessionToDelete={setSessionToDelete}
            setQuestionToDelete={setQuestionToDelete}
            setActivePanel={setActivePanel}
            scrollToElement={scrollToElement}
            handleSessionDragStart={handleSessionDragStart}
            handleSessionDragOver={handleSessionDragOver}
            handleQuestionDragStart={handleQuestionDragStart}
            handleQuestionDragOver={handleQuestionDragOver}
          />
        )}

        {activePanel === 'preview' && (
          <ExitSurveyFormPreviewPanel form={form} />
        )}

        {activePanel === 'responses' && (
          <ExitSurveyFormResponsePanel form={form} />
        )}
      </div>

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bagian?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus bagian <strong>{sessionToDelete?.name}</strong>? 
              Tindakan ini juga akan menghapus semua pertanyaan yang ada di dalamnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToDelete) {
                  deleteSessionMutation.mutate(sessionToDelete.id);
                  setSessionToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pertanyaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pertanyaan ini? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (questionToDelete) {
                  deleteQuestionMutation.mutate(questionToDelete.id);
                  setQuestionToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
