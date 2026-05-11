import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { toTitleCaseName } from '@/lib/text';
import { cn } from '@/lib/utils';
import { useYudisiumAnnouncements } from '@/hooks/yudisium/useYudisium';

function formatDateHeader(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export default function YudisiumAnnouncementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Pengumuman' }, { label: 'Yudisium' }]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  const { data: announcements, isLoading } = useYudisiumAnnouncements();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!announcements) return [];
    const q = search.toLowerCase().trim();
    return announcements.filter((a) => {
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.participants.some(p => 
          p.studentName.toLowerCase().includes(q) || 
          p.studentNim.toLowerCase().includes(q) ||
          p.thesisTitle.toLowerCase().includes(q)
        );
      return matchSearch;
    });
  }, [announcements, search]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
        <Loading size="lg" text="Memuat pengumuman yudisium..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pengumuman Hasil Yudisium</h1>
        <p className="text-muted-foreground mt-1">
          Daftar mahasiswa yang telah ditetapkan sebagai peserta yudisium.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1 sm:max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIM, atau judul..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Announcement List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <CalendarDays className="h-12 w-12 opacity-30" />
          <p className="text-sm">
            {search ? 'Tidak ditemukan pengumuman yang sesuai.' : 'Belum ada pengumuman hasil yudisium.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                  <h2 className="font-bold text-lg">{item.name}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 opacity-60" />
                    <span>{formatDateHeader(item.eventDate)}</span>
                  </div>
                  {item.room && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 opacity-60" />
                      <span>{item.room.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-0.5 rounded-full">
                    <Users className="h-3 w-3 opacity-60" />
                    <span>{item.participants.length} Peserta</span>
                  </div>
                </div>
              </div>

              <Card className="overflow-hidden border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/30 border-b">
                          <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-16 text-center">No</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mahasiswa</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Judul Tugas Akhir</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {item.participants.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4 text-xs text-muted-foreground text-center font-medium tabular-nums">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-sm text-foreground">{toTitleCaseName(p.studentName)}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5 tracking-wider">{p.studentNim}</p>
                            </td>
                            <td className="px-6 py-4 hidden lg:table-cell max-w-xl">
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-40" />
                                <p className="text-xs line-clamp-2 leading-relaxed italic">{p.thesisTitle}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className={cn(
                                "h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider",
                                p.status === 'finalized' 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              )}>
                                <CheckCircle2 className={cn("h-3 w-3 mr-1.5", p.status === 'finalized' ? "text-emerald-600" : "text-blue-600")} strokeWidth={3} />
                                {p.status === 'finalized' ? 'LULUS' : 'PESERTA'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {item.notes && (
                    <div className="bg-muted/5 px-6 py-3 border-t border-border/50 text-[11px] text-muted-foreground flex gap-2">
                      <span className="font-bold uppercase tracking-wider opacity-60 shrink-0">Catatan:</span>
                      <span className="italic leading-relaxed">"{item.notes}"</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
