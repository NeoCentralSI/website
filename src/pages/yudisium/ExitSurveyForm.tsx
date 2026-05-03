import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  GripVertical, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Settings2,
  Calendar,
  HelpCircle,
  Copy,
  PenTool,
  Eye,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
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
  ExitSurveyForm, 
  ExitSurveySession, 
  ExitSurveyQuestion,
  ExitSurveyQuestionType,
  UpdateExitSurveyFormPayload,
  CreateExitSurveySessionPayload,
  UpdateExitSurveySessionPayload,
  CreateExitSurveyQuestionPayload,
  UpdateExitSurveyQuestionPayload
} from '@/types/exit-survey.types';

const QUESTION_TYPES: { label: string; value: ExitSurveyQuestionType }[] = [
  { label: 'Pilihan Tunggal', value: 'single_choice' },
  { label: 'Pilihan Ganda', value: 'multiple_choice' },
  { label: 'Teks Pendek', value: 'text' },
  { label: 'Teks Panjang', value: 'textarea' },
];

export default function ExitSurveyFormPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const formId = id!;

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { data: form, isLoading } = useQuery({
    queryKey: ['exit-survey', 'form', formId],
    queryFn: () => getExitSurveyFormById(formId),
    enabled: !!formId,
  });

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

  // Mutations
  const updateFormMutation = useMutation({
    mutationFn: (data: UpdateExitSurveyFormPayload) => updateExitSurveyForm(formId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data: CreateExitSurveySessionPayload) => createExitSurveySession(formId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: CreateExitSurveyQuestionPayload) => createExitSurveyQuestion(formId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exit-survey', 'form', formId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loading size="lg" text="Memuat data form..." />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header - Static Title */}
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
            <p className="text-muted-foreground">
              Kelola bagian dan pertanyaan-pertanyaan exit survey mahasiswa
            </p>
          </div>
        </div>

        {/* Navigation Buttons - Edit | Preview | Respons */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-lg border border-gray-200 shrink-0">
           <Button variant="ghost" size="sm" className="h-8 gap-2 bg-white shadow-sm hover:bg-white text-primary font-semibold px-4">
              <PenTool className="h-3.5 w-3.5" />
              Edit
           </Button>
           <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground px-4">
              <Eye className="h-3.5 w-3.5" />
              Preview
           </Button>
           <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground px-4">
              <MessageSquare className="h-3.5 w-3.5" />
              Respons
           </Button>
        </div>
      </div>

      <Separator />

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Form Identity Card */}
        <Card className="border-t-8 border-t-primary shadow-sm overflow-hidden group">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
               <div className="flex-1 min-w-0 space-y-4">
                  <Input
                    value={form.name}
                    onChange={(e) => updateFormMutation.mutate({ name: e.target.value })}
                    className="text-3xl font-bold border-none px-0 h-auto focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary rounded-none placeholder:text-muted-foreground/50 transition-all bg-transparent w-full"
                    placeholder="Judul Formulir"
                  />
                  <Textarea
                    value={form.description ?? ''}
                    onChange={(e) => updateFormMutation.mutate({ description: e.target.value })}
                    className="text-muted-foreground border-none px-0 min-h-[40px] h-auto resize-none focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary rounded-none placeholder:text-muted-foreground/50 transition-all bg-transparent overflow-hidden text-base w-full break-all"
                    placeholder="Deskripsi formulir (opsional)"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
               </div>
               
               <div className="flex flex-col gap-2 shrink-0 pt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1.5 px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                    <Calendar className="h-3 w-3" />
                    Terpakai: {form.usedCount}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1.5 px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                    <HelpCircle className="h-3 w-3" />
                    {form.totalQuestions} Pertanyaan
                  </Badge>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions and Questions */}
        <div className="space-y-8">
        {(form.sessions ?? []).map((session, sIdx) => (
          <div key={session.id} className="space-y-4">
            {/* Session Card */}
            <Card className="shadow-sm border-l-4 border-l-blue-500 overflow-hidden relative group">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      value={session.name}
                      onChange={(e) => updateSessionMutation.mutate({ sId: session.id, data: { name: e.target.value } })}
                      className="text-xl font-semibold border-none px-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-500 rounded-none placeholder:text-muted-foreground/50 transition-all bg-transparent"
                      placeholder="Judul Bagian"
                    />
                    <Textarea
                      value={session.description ?? ''}
                      onChange={(e) => updateSessionMutation.mutate({ sId: session.id, data: { description: e.target.value } })}
                      className="text-sm text-muted-foreground border-none px-0 min-h-[30px] h-auto resize-none focus-visible:ring-0 focus-visible:border-b focus-visible:border-blue-500 rounded-none placeholder:text-muted-foreground/50 transition-all bg-transparent"
                      placeholder="Deskripsi bagian (opsional)"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                       onClick={() => deleteSessionMutation.mutate(session.id)}
                       title="Hapus Bagian"
                       disabled={session.questions.length > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Questions List inside Session */}
                <div className="mt-6 space-y-4 pl-4 border-l-2 border-gray-50">
                  {session.questions.map((question, qIdx) => (
                    <Card key={question.id} className="shadow-none border-gray-100 hover:border-primary/30 transition-colors group/q relative overflow-hidden">
                       <CardContent className="p-4 space-y-4">
                          <div className="flex gap-4">
                             <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                   <Badge variant="outline" className="mt-1 h-6 w-6 flex items-center justify-center p-0 rounded-full bg-gray-50 shrink-0 font-bold border-gray-200">
                                      {qIdx + 1}
                                   </Badge>
                                   <div className="flex-1 space-y-1">
                                      <Input 
                                         value={question.question}
                                         onChange={(e) => updateQuestionMutation.mutate({ qId: question.id, data: { question: e.target.value } })}
                                         className="text-base font-medium border-none px-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary rounded-none placeholder:text-muted-foreground/50 transition-all bg-transparent"
                                         placeholder="Pertanyaan"
                                      />
                                   </div>
                                </div>

                                <div className="flex items-center gap-4">
                                   <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                         <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 bg-gray-50 hover:bg-gray-100">
                                            {QUESTION_TYPES.find(t => t.value === question.questionType)?.label}
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                         </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                         {QUESTION_TYPES.map(type => (
                                            <DropdownMenuItem 
                                               key={type.value}
                                               onClick={() => updateQuestionMutation.mutate({ qId: question.id, data: { questionType: type.value } })}
                                            >
                                               {type.label}
                                            </DropdownMenuItem>
                                         ))}
                                      </DropdownMenuContent>
                                   </DropdownMenu>

                                   <div className="flex items-center gap-2">
                                      <Label htmlFor={`required-${question.id}`} className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold cursor-pointer">Wajib</Label>
                                      <Switch 
                                         id={`required-${question.id}`}
                                         checked={question.isRequired}
                                         onCheckedChange={(val) => updateQuestionMutation.mutate({ qId: question.id, data: { isRequired: val } })}
                                         className="scale-75 origin-left"
                                      />
                                   </div>
                                </div>

                                {/* Options if choice type */}
                                {(question.questionType === 'single_choice' || question.questionType === 'multiple_choice') && (
                                   <div className="space-y-2 pt-2">
                                      {(question.options ?? []).map((opt, oIdx) => (
                                         <div key={opt.id || oIdx} className="flex items-center gap-2 pl-2 group/opt">
                                            <div className={question.questionType === 'single_choice' ? 'h-4 w-4 rounded-full border border-gray-300' : 'h-4 w-4 rounded border border-gray-300'} />
                                            <Input 
                                               value={opt.optionText}
                                               onChange={(e) => {
                                                  const newOptions = [...(question.options ?? [])];
                                                  newOptions[oIdx] = { ...newOptions[oIdx], optionText: e.target.value };
                                                  updateQuestionMutation.mutate({ qId: question.id, data: { options: newOptions } });
                                               }}
                                               className="text-sm border-none px-0 h-auto focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary rounded-none transition-all py-0.5 bg-transparent"
                                               placeholder={`Opsi ${oIdx + 1}`}
                                            />
                                            <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-6 w-6 opacity-0 group-hover/opt:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-50"
                                               onClick={() => {
                                                  const newOptions = question.options?.filter((_, i) => i !== oIdx);
                                                  updateQuestionMutation.mutate({ qId: question.id, data: { options: newOptions } });
                                               }}
                                            >
                                               <X className="h-3 w-3" />
                                            </Button>
                                         </div>
                                      ))}
                                      <Button 
                                         variant="ghost" 
                                         size="sm" 
                                         className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/5 -ml-1"
                                         onClick={() => {
                                            const newOptions = [...(question.options ?? []), { optionText: `Opsi ${(question.options?.length ?? 0) + 1}`, orderNumber: (question.options?.length ?? 0) + 1 }];
                                            updateQuestionMutation.mutate({ qId: question.id, data: { options: newOptions } });
                                         }}
                                      >
                                         <Plus className="h-3 w-3 mr-1" />
                                         Tambah Opsi
                                      </Button>
                                   </div>
                                )}
                             </div>

                             <div className="flex flex-col gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                   onClick={() => deleteQuestionMutation.mutate(question.id)}
                                   title="Hapus Pertanyaan"
                                >
                                   <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
                  <Button 
                     variant="outline" 
                     className="w-full border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all py-6 rounded-lg"
                     onClick={() => createQuestionMutation.mutate({ 
                        exitSurveySessionId: session.id,
                        question: 'Pertanyaan Baru',
                        questionType: 'text',
                        isRequired: false,
                        orderNumber: session.questions.length + 1
                     })}
                  >
                     <Plus className="h-4 w-4 mr-2" />
                     Tambah Pertanyaan ke {session.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        
        <Button 
           variant="secondary" 
           className="w-full py-8 text-base font-medium border-2 border-dashed bg-gray-50/50 hover:bg-gray-100/50 transition-all text-muted-foreground hover:text-primary"
           onClick={() => createSessionMutation.mutate({ 
              name: `Bagian ${(form.sessions?.length ?? 0) + 1}`,
              order: (form.sessions?.length ?? 0) + 1
           })}
        >
           <Plus className="h-5 w-5 mr-2" />
           Tambah Bagian Baru
        </Button>
      </div>

      {/* Footer Section - Part of flow, not absolute */}
      <div className="pt-8 border-t flex items-center justify-between">
         <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Perubahan disimpan secara otomatis.
         </p>
         <Button onClick={() => navigate(-1)} size="lg" className="px-8 shadow-md">
            <Check className="h-5 w-5 mr-2" />
            Selesai
         </Button>
      </div>
    </div>
  </div>
  );
}
