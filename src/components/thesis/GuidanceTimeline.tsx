import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Download, XCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GuidanceItem, CompletedGuidance, GuidanceStatus } from '@/services/studentGuidance.service';

function getStatusBadge(status: GuidanceStatus | string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Selesai</Badge>;
    case 'summary_pending':
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Menunggu Ringkasan</Badge>;
    case 'accepted':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Disetujui</Badge>;
    case 'requested':
      return <Badge variant="secondary">Menunggu Respon</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Ditolak</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-gray-500">Dibatalkan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTimelineDotClasses(status: GuidanceStatus | string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500 ring-emerald-200';
    case 'accepted':
    case 'summary_pending':
      return 'bg-blue-500 ring-blue-200';
    case 'requested':
      return 'bg-amber-400 ring-amber-200 animate-pulse';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-500 ring-red-200';
    default:
      return 'bg-gray-300 ring-gray-100';
  }
}

function TimelineDot({ status }: { status: GuidanceStatus | string }) {
  const isCompleted = status === 'completed';
  const isError = status === 'rejected' || status === 'cancelled';

  return (
    <div
      className={cn(
        "relative z-10 flex items-center justify-center h-7 w-7 rounded-full ring-4 bg-background",
        getTimelineDotClasses(status)
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
      ) : isError ? (
        <XCircle className="h-3.5 w-3.5 text-white" />
      ) : (
        <div className={cn(
          "h-2 w-2 rounded-full",
          status === "requested" ? "bg-white" : "bg-white/80"
        )} />
      )}
    </div>
  );
}

interface GuidanceTimelineProps {
  items: (GuidanceItem | CompletedGuidance)[];
  onViewDetail?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onExport?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

export function GuidanceTimeline({
  items,
  onViewDetail,
  onReschedule,
  onCancel,
  onExport,
  selectedIds,
  onToggleSelect,
  showCheckbox = false,
}: GuidanceTimelineProps) {
  // Group by phase
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: (GuidanceItem | CompletedGuidance)[] } = {
      thesis: [],
      proposal: [],
    };
    items.forEach(item => {
      if (item.phase === 'proposal') {
        groups.proposal.push(item);
      } else {
        groups.thesis.push(item);
      }
    });
    return groups;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Belum ada bimbingan</h3>
        <p className="text-muted-foreground max-w-sm">
          Data bimbingan belum tersedia atau belum ada yang sesuai kriteria.
        </p>
      </div>
    );
  }

  const renderGroup = (title: string, groupItems: (GuidanceItem | CompletedGuidance)[], isProposal: boolean) => {
    if (groupItems.length === 0) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-background/95 py-2 z-20 backdrop-blur-sm border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <Badge variant={isProposal ? "secondary" : "default"} className={cn(isProposal ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800")}>
            {groupItems.length} Sesi
          </Badge>
        </div>
        
        <div className="space-y-4">
          {groupItems.map((item, index) => {
            const status = (item as any).status || 'completed'; // CompletedHistory might not have status field if it's implicitly completed, but it does in some APIs. Let's default to completed.
            const dateStr = item.completedAtFormatted || item.approvedDateFormatted || (item as any).requestedDateFormatted || '-';
            const isActive = onViewDetail !== undefined;
            const canReschedule = isActive && status === 'accepted' && onReschedule;
            const canCancel = isActive && (status === 'requested' || status === 'accepted') && onCancel;
            const canExport = (status === 'completed' || status === 'summary_pending') && onExport;
            
            return (
              <div key={item.id} className="relative flex gap-4 items-start group">
                <div className="relative flex flex-col items-center mt-1">
                  <TimelineDot status={status} />
                  {index !== groupItems.length - 1 && (
                    <div className="absolute top-7 bottom-[-1.5rem] w-0.5 bg-border z-0" />
                  )}
                </div>
                
                <Card className={cn(
                  "flex-1 transition-all hover:shadow-md",
                  selectedIds?.has(item.id) && "ring-2 ring-primary/60 border-primary"
                )}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div className="flex items-start gap-3">
                        {showCheckbox && onToggleSelect && (
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={selectedIds?.has(item.id)}
                              onChange={() => onToggleSelect(item.id)}
                              className="h-4 w-4 accent-primary cursor-pointer"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-base">{item.supervisorName || 'Dosen Pembimbing'}</span>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{dateStr}</span>
                            </div>
                            {item.duration > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{item.duration} menit</span>
                              </div>
                            )}
                          </div>
                          
                          {(item.sessionSummary || item.studentNotes) && (
                            <div className="mt-2 text-sm bg-muted/50 p-2.5 rounded-md border text-muted-foreground">
                              <p className="line-clamp-2">
                                <span className="font-medium text-foreground mr-1">
                                  {item.sessionSummary ? 'Ringkasan:' : 'Catatan:'}
                                </span>
                                {item.sessionSummary || item.studentNotes}
                              </p>
                            </div>
                          )}
                          
                          {item.milestoneName && (
                            <div className="mt-2 text-xs font-medium text-primary bg-primary/10 inline-flex px-2 py-1 rounded">
                              Milestone: {item.milestoneName}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2 items-end justify-start sm:justify-center">
                        {isActive && (status === 'accepted' || status === 'summary_pending' || status === 'completed') && onViewDetail && (
                          <Button variant="secondary" size="sm" onClick={() => onViewDetail(item.id)} className="w-full sm:w-auto">
                            Detail Sesi
                            <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        )}
                        <div className="flex gap-2">
                          {canReschedule && (
                            <Button variant="outline" size="sm" onClick={() => onReschedule(item.id)}>
                              Reschedule
                            </Button>
                          )}
                          {canCancel && (
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onCancel(item.id)}>
                              Batalkan
                            </Button>
                          )}
                          {canExport && (
                            <Button variant="outline" size="sm" onClick={() => onExport(item.id)} title="Download PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderGroup("Tugas Akhir", groupedItems.thesis, false)}
      {renderGroup("Proposal (Metopel)", groupedItems.proposal, true)}
    </div>
  );
}
