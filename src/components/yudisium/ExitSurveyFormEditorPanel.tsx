import { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ChevronDown, 
  Calendar,
  HelpCircle,
  GripVertical,
  MoveVertical,
  Loader2,
  Eye,
  ArrowLeft,
  Copy,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ExitSurveyQuestionType } from '@/types/exit-survey.types';

const QUESTION_TYPES: { label: string; value: ExitSurveyQuestionType }[] = [
  { label: 'Jawaban Singkat', value: 'short_answer' },
  { label: 'Paragraf', value: 'paragraph' },
  { label: 'Pilihan Ganda', value: 'single_choice' },
  { label: 'Kotak Centang', value: 'multiple_choice' },
  { label: 'Tanggal', value: 'date' },
];

const QuestionCard = ({ 
  question, 
  qIdx, 
  totalPrevQuestions, 
  reorderMode, 
  draggingId, 
  handleDragStart, 
  handleDragOver, 
  handleDragEnd,
  updateMutation,
  onDelete,
  onDuplicate,
  isLocked
}: any) => {
  const [localQuestion, setLocalQuestion] = useState(question.question);
  const [localDesc, setLocalDesc] = useState(question.description || '');
  const [localType, setLocalType] = useState(question.questionType);
  const [localOptions, setLocalOptions] = useState(question.options || []);
  const [isRequired, setIsRequired] = useState(question.isRequired);
  const [isDirty, setIsDirty] = useState(false);

  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalQuestion(question.question);
    setLocalDesc(question.description || '');
    setLocalType(question.questionType);
    setLocalOptions(question.options || []);
    setIsRequired(question.isRequired);
    setIsDirty(false);
  }, [question]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (descRef.current) {
        descRef.current.style.height = 'auto';
        descRef.current.style.height = `${descRef.current.scrollHeight}px`;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [localDesc]);

  const handleSave = () => {
    updateMutation.mutate({ 
      qId: question.id, 
      data: { 
        question: localQuestion, 
        description: localDesc, 
        questionType: localType, 
        options: localOptions,
        isRequired
      } 
    });
    setIsDirty(false);
  };

  const handleOptionChange = (oIdx: number, val: string) => {
    const next = [...localOptions];
    next[oIdx] = { ...next[oIdx], optionText: val };
    setLocalOptions(next);
    setIsDirty(true);
  };

  const handleAddOption = () => {
    const next = [...localOptions, { optionText: `Opsi ${localOptions.length + 1}`, orderNumber: localOptions.length + 1 }];
    setLocalOptions(next);
    setIsDirty(true);
  };

  const handleRemoveOption = (oIdx: number) => {
    const next = localOptions.filter((_: any, i: number) => i !== oIdx);
    setLocalOptions(next);
    setIsDirty(true);
  };

  return (
    <div 
      draggable={reorderMode === 'questions'}
      onDragStart={() => handleDragStart(question.id)}
      onDragOver={(e) => handleDragOver(e, question.id)}
      onDragEnd={handleDragEnd}
      className={cn(
        "bg-white rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all group/q relative overflow-hidden scroll-mt-24",
        reorderMode === 'questions' && draggingId === question.id && "opacity-50 border-primary border-dashed",
        reorderMode === 'questions' && "cursor-grab"
      )}
      id={`question-${question.id}`}
    >
       <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
             {reorderMode === 'questions' ? (
               <div className="mt-1 p-1 rounded hover:bg-muted/30 transition-colors shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/30" />
               </div>
             ) : (
               <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 text-xs font-bold border border-primary/20">
                  {qIdx + 1 + totalPrevQuestions}
               </div>
             )}
             
             <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                   <div className="flex-1">
                      <input 
                         value={localQuestion}
                         onChange={(e) => { setLocalQuestion(e.target.value); setIsDirty(true); }}
                         className={cn(
                           "text-base font-semibold border-none px-0 h-auto focus:outline-none focus:border-b focus:border-primary/50 rounded-none placeholder:text-muted-foreground/30 transition-all bg-transparent w-full",
                           isLocked && "cursor-default"
                         )}
                         placeholder="Pertanyaan"
                         readOnly={isLocked}
                      />
                      <textarea
                         ref={descRef}
                         value={localDesc}
                         onChange={(e) => { setLocalDesc(e.target.value); setIsDirty(true); }}
                         className={cn(
                           "text-xs text-foreground/60 font-medium border-none px-0 mt-0.5 min-h-[20px] h-auto resize-none focus:outline-none focus:border-b focus:border-primary/30 rounded-none placeholder:text-muted-foreground/20 transition-all bg-transparent w-full leading-relaxed",
                           isLocked && "cursor-default"
                         )}
                         placeholder="Tambahkan deskripsi (opsional)"
                         rows={1}
                         readOnly={isLocked}
                         onInput={(e: any) => {
                           if (isLocked) return;
                           const target = e.target as HTMLTextAreaElement;
                           target.style.height = 'auto';
                           target.style.height = `${target.scrollHeight}px`;
                         }}
                      />
                   </div>
                   <div className="w-40 shrink-0">
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild disabled={reorderMode === 'questions' || isLocked}>
                            <Button variant="outline" size="sm" className="w-full justify-between h-8 px-2 bg-muted/10 text-[11px] font-medium border-border/40" disabled={isLocked}>
                               <span>
                                  {QUESTION_TYPES.find(t => t.value === localType)?.label}
                               </span>
                               <ChevronDown className="h-3 w-3 opacity-40" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-40">
                            {QUESTION_TYPES.map((type) => (
                               <DropdownMenuItem 
                                  key={type.value}
                                  onClick={() => { setLocalType(type.value); setIsDirty(true); }}
                                  className="gap-2 text-xs"
                               >
                                  <div className={cn(
                                     "h-1.5 w-1.5 rounded-full",
                                     localType === type.value ? "bg-primary" : "bg-transparent"
                                  )} />
                                  {type.label}
                               </DropdownMenuItem>
                            ))}
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </div>

                <div className="pl-0">
                  {localType === 'short_answer' && (
                      <div className="text-muted-foreground/30 border-b border-dashed border-border/40 pb-1 text-[11px] italic">
                        Jawaban singkat
                      </div>
                  )}
                  {localType === 'paragraph' && (
                      <div className="text-muted-foreground/30 border-b border-dashed border-border/40 pb-1 text-[11px] italic">
                        Jawaban panjang
                      </div>
                  )}
                  {localType === 'date' && (
                      <div className="flex items-center gap-2 text-muted-foreground/30 border-b border-dashed border-border/40 pb-1 text-[11px] italic">
                        <Calendar className="h-3 w-3" />
                        hari/bulan/tahun
                    </div>
                  )}
                  
                  {(localType === 'single_choice' || localType === 'multiple_choice') && (
                    <div className="space-y-1.5">
                       {(localOptions ?? []).map((option: any, oIdx: number) => (
                         <div key={option.id || oIdx} className="flex items-center gap-2.5 group/opt">
                            <div className={`h-3.5 w-3.5 shrink-0 border ${localType === 'single_choice' ? 'rounded-full' : 'rounded'} border-border/60`} />
                            <input 
                               value={option.optionText}
                               onChange={(e) => handleOptionChange(oIdx, e.target.value)}
                               className={cn(
                                 "flex-1 text-xs bg-transparent border-none focus:outline-none focus:border-b focus:border-border/60 transition-all py-0.5",
                                 isLocked && "cursor-default"
                               )}
                               placeholder={`Opsi ${oIdx + 1}`}
                               readOnly={isLocked}
                            />
                            {!isLocked && (
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-5 w-5 opacity-0 group-hover/opt:opacity-100 hover:text-destructive shrink-0"
                                 onClick={() => handleRemoveOption(oIdx)}
                               >
                                  <X className="h-3 w-3" />
                               </Button>
                            )}
                         </div>
                       ))}
                       {!isLocked && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-7 text-primary hover:text-primary hover:bg-primary/5 -ml-1.5 gap-1.5 text-[11px] font-medium"
                           onClick={handleAddOption}
                         >
                            <Plus className="h-3 w-3" />
                            Tambah Opsi
                         </Button>
                       )}
                    </div>
                  )}
               </div>
             </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
             <div className="flex items-center gap-2">
                {isDirty && (
                  <Button 
                    size="sm" 
                    className="h-7 px-3 gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm text-[11px] font-bold"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Simpan
                  </Button>
                )}
             </div>
             
             <div className="flex items-center gap-4">
                {!isLocked && (
                  <div className="flex items-center gap-2 border-r pr-4 border-border/30">
                     <Label htmlFor={`required-${question.id}`} className="text-[11px] font-semibold text-muted-foreground">Wajib</Label>
                     <Switch 
                        id={`required-${question.id}`}
                        checked={isRequired}
                        onCheckedChange={(val) => { setIsRequired(val); setIsDirty(true); }}
                        className="scale-[0.7] origin-right"
                     />
                  </div>
                )}
                {!isLocked && (
                  <div className="flex items-center gap-1">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors"
                        onClick={() => onDuplicate(question)}
                        title="Duplikat Pertanyaan"
                     >
                        <Copy className="h-3.5 w-3.5" />
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                        onClick={onDelete}
                        title="Hapus"
                     >
                        <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

const SessionCard = ({ 
  session, 
  reorderMode, 
  draggingId, 
  handleDragStart, 
  handleDragOver, 
  handleDragEnd,
  updateMutation,
  onDelete,
  isLocked
}: any) => {
  const [localName, setLocalName] = useState(session.name);
  const [localDesc, setLocalDesc] = useState(session.description || '');
  const [isDirty, setIsDirty] = useState(false);

  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalName(session.name);
    setLocalDesc(session.description || '');
    setIsDirty(false);
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (descRef.current) {
        descRef.current.style.height = 'auto';
        descRef.current.style.height = `${descRef.current.scrollHeight}px`;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [localDesc]);

  const handleSave = () => {
    updateMutation.mutate({ 
      sId: session.id, 
      data: { 
        name: localName, 
        description: localDesc 
      } 
    });
    setIsDirty(false);
  };

  return (
    <div 
      className={cn(
        "rounded-xl border border-border/80 border-l-4 border-l-primary overflow-hidden relative group bg-white transition-all shadow-sm",
        reorderMode === 'sessions' && draggingId === session.id && "opacity-50 border-primary border-dashed",
        reorderMode === 'sessions' && "cursor-grab"
      )}
      draggable={reorderMode === 'sessions'}
      onDragStart={() => handleDragStart(session.id)}
      onDragOver={(e) => handleDragOver(e, session.id)}
      onDragEnd={handleDragEnd}
      id={`session-${session.id}`}
    >
      <div className="py-3.5 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <input
                value={localName}
                onChange={(e) => { setLocalName(e.target.value); setIsDirty(true); }}
                className={cn(
                  "text-lg font-bold border-none px-0 h-auto focus:outline-none focus:border-b focus:border-primary/50 rounded-none placeholder:text-muted-foreground/30 transition-all bg-transparent w-full font-display",
                  isLocked && "cursor-default"
                )}
                placeholder="Judul Bagian"
                readOnly={isLocked}
              />
              {isDirty && (
                <Button 
                  size="sm" 
                  className="shrink-0 h-7 px-3 gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm text-[11px] font-bold"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Simpan
                </Button>
              )}
            </div>
            <textarea
              ref={descRef}
              value={localDesc}
              onChange={(e) => { setLocalDesc(e.target.value); setIsDirty(true); }}
              className={cn(
                "text-xs text-foreground/70 font-medium border-none px-0 min-h-[20px] h-auto resize-none focus:outline-none focus:border-b focus:border-primary/30 rounded-none placeholder:text-muted-foreground/20 transition-all bg-transparent w-full leading-relaxed",
                isLocked && "cursor-default"
              )}
              placeholder="Tambahkan deskripsi bagian (opsional)"
              rows={1}
              readOnly={isLocked}
              onInput={(e: any) => {
                if (isLocked) return;
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {!isLocked && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExitSurveyFormEditorPanelProps {
  form: any;
  reorderMode: 'none' | 'sessions' | 'questions';
  setReorderMode: (mode: 'none' | 'sessions' | 'questions') => void;
  orderedSessions: any[];
  setOrderedSessions: React.Dispatch<React.SetStateAction<any[]>>;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  hasReordered: boolean;
  setHasReordered: (val: boolean) => void;
  isSavingOrder: boolean;
  handleSaveOrder: () => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  localFormName: string;
  setLocalFormName: (val: string) => void;
  localFormDesc: string;
  setLocalFormDesc: (val: string) => void;
  isIdentityDirty: boolean;
  setIsIdentityDirty: (val: boolean) => void;
  formDescRef: React.RefObject<HTMLTextAreaElement>;
  updateFormMutation: any;
  createSessionMutation: any;
  updateSessionMutation: any;
  deleteSessionMutation: any;
  createQuestionMutation: any;
  updateQuestionMutation: any;
  deleteQuestionMutation: any;
  setSessionToDelete: (val: any) => void;
  setQuestionToDelete: (val: any) => void;
  setActivePanel: (val: 'editor' | 'preview' | 'responses') => void;
  scrollToElement: (id: string, offset?: number) => void;
  handleSessionDragStart: (id: string) => void;
  handleSessionDragOver: (e: React.DragEvent, targetId: string) => void;
  handleQuestionDragStart: (id: string) => void;
  handleQuestionDragOver: (e: React.DragEvent, targetId: string, sessionId: string) => void;
}

const ExitSurveyFormEditorPanel = (props: ExitSurveyFormEditorPanelProps) => {
  const {
    form,
    reorderMode,
    setReorderMode,
    orderedSessions,
    setOrderedSessions,
    draggingId,
    setDraggingId,
    hasReordered,
    setHasReordered,
    isSavingOrder,
    handleSaveOrder,
    activeSessionId,
    setActiveSessionId,
    localFormName,
    setLocalFormName,
    localFormDesc,
    setLocalFormDesc,
    isIdentityDirty,
    setIsIdentityDirty,
    formDescRef,
    updateFormMutation,
    createSessionMutation,
    updateSessionMutation,
    deleteSessionMutation,
    createQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
    setSessionToDelete,
    setQuestionToDelete,
    setActivePanel,
    scrollToElement,
    handleSessionDragStart,
    handleSessionDragOver,
    handleQuestionDragStart,
    handleQuestionDragOver
  } = props;

  const isLocked = (form.usedCount || 0) > 0;

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
           <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
           <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 font-display">Formulir Terkunci</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                 Formulir ini sudah memiliki respons atau sedang digunakan dalam acara yudisium. 
                 Untuk menjaga integritas data, perubahan struktur (tambah/hapus/tipe) telah dinonaktifkan. 
                 Silakan gunakan fitur <strong>Duplikat</strong> jika ingin membuat versi baru.
              </p>
           </div>
        </div>
      )}
      
      <div className="flex gap-8 items-start">
        {/* Left Sidebar - Form Structure */}
        <aside className="w-72 sticky top-6 shrink-0 hidden lg:block self-start space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
             <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display">Struktur Formulir</h3>
                 <div className="flex items-center gap-1">
                   {(reorderMode !== 'none') && hasReordered && (
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary/80 hover:bg-primary/10" onClick={handleSaveOrder} disabled={isSavingOrder}>
                       {isSavingOrder ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                     </Button>
                   )}
                   
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={reorderMode === 'questions' || isLocked}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-6 w-6 transition-colors", reorderMode !== 'none' ? "text-primary bg-primary/10" : "text-muted-foreground")}
                          disabled={isLocked}
                        >
                          <MoveVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-48">
                       <DropdownMenuItem 
                         onClick={() => {
                           if (reorderMode === 'sessions') {
                             setReorderMode('none');
                             setHasReordered(false);
                             setOrderedSessions(form.sessions?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) || []);
                           } else {
                             setReorderMode('sessions');
                             setHasReordered(false);
                           }
                         }}
                         className="gap-2"
                       >
                         <GripVertical className="h-4 w-4" />
                         <span>{reorderMode === 'sessions' ? 'Selesai Urutkan Bagian' : 'Urutkan Bagian'}</span>
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         onClick={() => {
                           if (reorderMode === 'questions') {
                             setReorderMode('none');
                             setHasReordered(false);
                           } else {
                             setReorderMode('questions');
                             setHasReordered(false);
                           }
                         }}
                         className="gap-2"
                       >
                         <GripVertical className="h-4 w-4" />
                         <span>{reorderMode === 'questions' ? 'Selesai Urutkan Pertanyaan' : 'Urutkan Pertanyaan'}</span>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
             </div>
             <div className="p-2 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar bg-white">
                {orderedSessions.map((session, sIdx) => {
                  const isActive = activeSessionId === session.id || (!activeSessionId && sIdx === 0);
                  const displayName = session.name === `Bagian ${sIdx + 1}` ? session.name : `Bagian ${sIdx + 1} — ${session.name || 'Tanpa Judul'}`;
                  
                  return (
                    <div 
                      key={session.id} 
                      className="space-y-1"
                      draggable={reorderMode === 'sessions'}
                      onDragStart={() => handleSessionDragStart(session.id)}
                      onDragOver={(e) => handleSessionDragOver(e, session.id)}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <div 
                        className={cn(
                          "flex items-center w-full gap-2 h-9 px-3 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                          isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/20',
                          reorderMode === 'sessions' && draggingId === session.id && "opacity-50 border border-dashed border-primary",
                          reorderMode === 'sessions' && "cursor-grab"
                        )}
                        onClick={() => reorderMode === 'none' && scrollToElement(`session-${session.id}`, 100)}
                      >
                        {reorderMode === 'sessions' ? (
                          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                        ) : (
                          <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        )}
                        <span className="truncate flex-1">{displayName}</span>
                      </div>
                      {reorderMode === 'none' && (
                        <div className="pl-6 space-y-0.5 border-l border-border/50 ml-3.5">
                          {session.questions?.map((q: any, qIdx: number) => (
                            <button 
                              key={q.id} 
                              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors truncate"
                              title={q.question}
                              onClick={() => scrollToElement(`question-${q.id}`, 140)}
                            >
                              {qIdx + 1 + (orderedSessions.slice(0, sIdx).reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0)}. {q.question || 'Pertanyaan'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
              {!isLocked && (
                <div className="p-3 border-t bg-muted/20">
                   <Button variant="ghost" size="sm" className="w-full h-8 text-xs gap-2 text-primary hover:bg-primary/10 font-semibold" onClick={() => createSessionMutation.mutate({ name: `Bagian ${(form.sessions?.length ?? 0) + 1}`, order: (form.sessions?.length ?? 0) + 1 })}>
                      <Plus className="h-3 w-3" />
                      Tambah Bagian
                   </Button>
                </div>
              )}
          </div>

          <Button 
            className="w-full py-6 text-sm font-bold shadow-md bg-[#f59e0b] hover:bg-[#d97706] text-white gap-2"
            onClick={() => setActivePanel('preview')}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          <div className="space-y-8 pb-32">
            {/* Form Identity Card */}
            <div className="bg-white rounded-xl border border-border/80 border-t-4 border-t-primary shadow-sm overflow-hidden group">
              <div className="pt-6 pb-5 px-8 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                      <input
                        value={localFormName}
                        onChange={(e) => {
                          setLocalFormName(e.target.value);
                          setIsIdentityDirty(true);
                        }}
                        className={cn(
                          "text-xl font-bold tracking-tight border-none px-0 h-auto focus:outline-none focus:border-b-2 focus:border-primary/40 rounded-none placeholder:text-muted-foreground/30 transition-all bg-transparent w-full pb-0.5 font-display",
                          isLocked && "cursor-default"
                        )}
                        placeholder="Judul Formulir"
                        readOnly={isLocked}
                      />
                    {isIdentityDirty && (
                      <Button 
                        size="sm" 
                        className="shrink-0 h-7 px-3 gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm text-[11px] font-bold"
                        onClick={() => {
                          updateFormMutation.mutate({ name: localFormName, description: localFormDesc });
                          setIsIdentityDirty(false);
                        }}
                        disabled={updateFormMutation.isPending}
                      >
                        {updateFormMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Simpan
                      </Button>
                    )}
                  </div>
                  <textarea
                    ref={formDescRef}
                    value={localFormDesc}
                    onChange={(e) => {
                      setLocalFormDesc(e.target.value);
                      setIsIdentityDirty(true);
                    }}
                    className={cn(
                      "text-sm text-foreground/80 font-medium border-none px-0 min-h-[20px] h-auto resize-none focus:outline-none focus:border-b focus:border-primary/30 rounded-none placeholder:text-muted-foreground/20 transition-all bg-transparent overflow-hidden w-full break-all leading-relaxed",
                      isLocked && "cursor-default"
                    )}
                    placeholder="Tambahkan deskripsi formulir (opsional)"
                    rows={1}
                    readOnly={isLocked}
                    onInput={(e: any) => {
                      if (isLocked) return;
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </div>

                <div className="border-t border-border/40 w-full" />
                
                <div className="flex items-center justify-between gap-4 pt-1">
                   <div className="flex items-center gap-5 text-[11px] text-muted-foreground/70">
                      <div className="flex items-center gap-1.5">
                         <HelpCircle className="h-3.5 w-3.5" />
                         <span>Terpakai: <span className="font-bold text-foreground/80">{form.usedCount} kali</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <HelpCircle className="h-3.5 w-3.5" />
                         <span>{form.totalQuestions} pertanyaan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Calendar className="h-3.5 w-3.5" />
                         <span>Dibuat: {form.createdAt ? new Date(form.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2.5 bg-muted/20 pl-3 pr-1 py-0.5 rounded-full border border-border/30">
                      <Label htmlFor="form-active-toggle" className="text-[11px] font-bold cursor-pointer text-muted-foreground">Aktif</Label>
                      <Switch 
                        id="form-active-toggle"
                        checked={form.isActive}
                        onCheckedChange={(val) => updateFormMutation.mutate({ isActive: val })}
                        className="scale-[0.7] origin-right"
                      />
                   </div>
                </div>
              </div>
            </div>

            {/* Sessions and Questions */}
            <div className="space-y-12">
              {orderedSessions.map((session, sIdx) => (
                <div key={session.id} className="space-y-8">
                  <SessionCard 
                    session={session}
                    reorderMode={reorderMode}
                    draggingId={draggingId}
                    handleDragStart={handleSessionDragStart}
                    handleDragOver={handleSessionDragOver}
                    handleDragEnd={() => setDraggingId(null)}
                    updateMutation={updateSessionMutation}
                    onDelete={() => setSessionToDelete({ id: session.id, name: session.name })}
                    isLocked={isLocked}
                  />

                  <div className="space-y-6 ml-0 lg:ml-8 relative">
                     <div className="absolute left-[-2rem] top-0 bottom-0 w-px bg-gray-200 hidden lg:block" />
                     
                     {session.questions?.map((q: any, qIdx: number) => (
                       <QuestionCard 
                         key={q.id}
                         question={q}
                         qIdx={qIdx}
                         totalPrevQuestions={orderedSessions.slice(0, sIdx).reduce((acc, s) => acc + (s.questions?.length || 0), 0)}
                         reorderMode={reorderMode}
                         draggingId={draggingId}
                         handleDragStart={handleQuestionDragStart}
                         handleDragOver={(e: any, targetId: string) => handleQuestionDragOver(e, targetId, session.id)}
                         handleDragEnd={() => setDraggingId(null)}
                         updateMutation={updateQuestionMutation}
                         onDelete={() => setQuestionToDelete(q)}
                         onDuplicate={(sourceQ: any) => {
                           createQuestionMutation.mutate({
                             exitSurveySessionId: session.id,
                             question: `${sourceQ.question} (Copy)`,
                             description: sourceQ.description,
                             questionType: sourceQ.questionType,
                             isRequired: sourceQ.isRequired,
                             orderNumber: (session.questions?.length || 0) + 1,
                             options: sourceQ.options?.map((o: any) => ({
                               optionText: o.optionText,
                               orderNumber: o.orderNumber
                             }))
                           });
                         }}
                         isLocked={isLocked}
                       />
                     ))}
                  </div>

                  {reorderMode === 'none' && !isLocked && (
                    <div className="mt-6 flex justify-center">
                       <Button 
                         variant="outline" 
                         className="rounded-full px-6 h-10 gap-2 border border-dashed border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all text-xs font-bold"
                         onClick={() => createQuestionMutation.mutate({ 
                            exitSurveySessionId: session.id,
                            question: 'Pertanyaan Baru',
                            description: '',
                            questionType: 'short_answer',
                            isRequired: false,
                            orderNumber: (session.questions?.length || 0) + 1
                         })}
                       >
                          <Plus className="h-4 w-4" />
                          Tambah Pertanyaan
                       </Button>
                    </div>
                  )}
                </div>
              ))}

              {reorderMode === 'none' && !isLocked && (
                <Button 
                  variant="secondary" 
                  className="w-full py-6 text-sm font-bold border border-dashed bg-white hover:bg-muted/30 transition-all text-muted-foreground hover:text-primary border-border"
                  onClick={() => createSessionMutation.mutate({ 
                     name: `Bagian ${(form.sessions?.length ?? 0) + 1}`,
                     order: (form.sessions?.length ?? 0) + 1
                  })}
                >
                   <Plus className="h-5 w-5 mr-2" />
                   Tambah Bagian Baru
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitSurveyFormEditorPanel;
// Trigger re-build
