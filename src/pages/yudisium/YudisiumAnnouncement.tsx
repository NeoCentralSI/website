import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import {
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { toTitleCaseName } from '@/lib/text';
import { useYudisiumAnnouncements } from '@/hooks/yudisium/useYudisium';

const PAGE_SIZE = 5;
const PARTICIPANT_PAGE_SIZE = 10;

type PaginationItem = number | 'ellipsis';

type AnnouncementParticipant = {
  id: string;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
};

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

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) items.push('ellipsis');
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < totalPages - 1) items.push('ellipsis');
  items.push(totalPages);
  return items;
}

export default function YudisiumAnnouncementPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Pengumuman' }, { label: 'Yudisium' }]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  const { data: announcements, isLoading } = useYudisiumAnnouncements();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [participantPages, setParticipantPages] = useState<Record<string, number>>({});

  const participantColumns = useMemo<Column<AnnouncementParticipant>[]>(() => [
    {
      key: 'no',
      header: 'No',
      width: 64,
      className: 'text-center',
      render: (_, index) => <span className="text-sm tabular-nums text-muted-foreground">{index + 1}</span>,
    },
    {
      key: 'studentName',
      header: 'Nama Mahasiswa',
      width: '28%',
      render: (row) => <span className="text-sm font-medium">{toTitleCaseName(row.studentName)}</span>,
    },
    {
      key: 'studentNim',
      header: 'NIM',
      width: 150,
      render: (row) => <span className="text-sm font-medium tabular-nums text-muted-foreground">{row.studentNim}</span>,
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      className: 'whitespace-normal',
      render: (row) => (
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <p className="text-sm leading-snug text-muted-foreground">{row.thesisTitle || '-'}</p>
        </div>
      ),
    },
  ], []);

  const filtered = useMemo(() => {
    if (!announcements) return [];
    const q = search.toLowerCase().trim();

    return announcements
      .map((item) => {
        if (!q) return item;

        const eventMatches = item.name.toLowerCase().includes(q);
        const participants = eventMatches
          ? item.participants
          : item.participants.filter((participant) =>
            participant.studentName.toLowerCase().includes(q) ||
            participant.studentNim.toLowerCase().includes(q) ||
            participant.thesisTitle.toLowerCase().includes(q)
          );

        return { ...item, participants };
      })
      .filter((item) => item.participants.length > 0 || item.name.toLowerCase().includes(q));
  }, [announcements, search]);

  const sortedAnnouncements = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aDate = a.eventDate ? new Date(a.eventDate).getTime() : 0;
      const bDate = b.eventDate ? new Date(b.eventDate).getTime() : 0;
      return bDate - aDate;
    });
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sortedAnnouncements.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
    setParticipantPages({});
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedAnnouncements.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedAnnouncements]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
        <Loading size="lg" text="Memuat pengumuman yudisium..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pengumuman Hasil Yudisium</h1>
        <p className="text-muted-foreground">
          Daftar mahasiswa yang telah ditetapkan sebagai peserta yudisium.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1 sm:max-w-[65%]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama mahasiswa, NIM, atau judul TA..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </Button>
            {getPaginationItems(currentPage, totalPages).map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  size="sm"
                  variant={currentPage === item ? 'default' : 'outline'}
                  className="h-8 min-w-8 px-2 text-xs"
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </Button>
              )
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Menampilkan {sortedAnnouncements.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedAnnouncements.length)} dari {sortedAnnouncements.length} pengumuman
        </span>
        <span>Halaman {currentPage} dari {totalPages}</span>
      </div>

      {paginatedAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 opacity-30" />
          <p className="text-sm">
            {search ? 'Tidak ditemukan pengumuman yang sesuai pencarian.' : 'Belum ada pengumuman hasil yudisium.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedAnnouncements.map((item) => {
            const participantPage = participantPages[item.id] ?? 1;
            const participantStart = (participantPage - 1) * PARTICIPANT_PAGE_SIZE;
            const paginatedParticipants = item.participants.slice(
              participantStart,
              participantStart + PARTICIPANT_PAGE_SIZE,
            );

            return (
              <div key={item.id} className="space-y-2">
                <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    <h2 className="truncate text-base font-semibold">{item.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 opacity-60" />
                      {formatDateHeader(item.eventDate)}
                    </span>
                    {item.room && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 opacity-60" />
                        {item.room.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 opacity-60" />
                      {item.participants.length} peserta
                    </span>
                  </div>
                </div>

                <CustomTable
                  columns={participantColumns}
                  data={paginatedParticipants as AnnouncementParticipant[]}
                  total={item.participants.length}
                  page={participantPage}
                  pageSize={PARTICIPANT_PAGE_SIZE}
                  onPageChange={(page) =>
                    setParticipantPages((prev) => ({ ...prev, [item.id]: page }))
                  }
                  rowKey={(row) => row.id}
                  emptyText="Tidak ada peserta yudisium pada pengumuman ini"
                  className="p-3"
                />

                {item.notes && (
                  <div className="rounded-md border bg-card px-4 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Catatan: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
