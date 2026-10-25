import EmptyState from '@/components/ui/empty-state';
import { SearchField } from '@/components/shared/SearchField';
import { ListPagination } from '@/components/shared/ListPagination';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { toTitleCaseName } from '@/lib/text';
import { useYudisiumAnnouncements } from '@/hooks/yudisium/useYudisium';

const PAGE_SIZE = 5;
const PARTICIPANT_PAGE_SIZE = 10;


type AnnouncementParticipant = {
  id: string;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  registeredAt: string | null;
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
      render: (_, index) => <span className="text-sm tabular-nums font-medium text-foreground">{index + 1}</span>,
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
      render: (row) => <span className="text-sm font-medium tabular-nums text-foreground">{row.studentNim}</span>,
    },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      className: 'whitespace-normal',
      render: (row) => (
        <p className="text-sm font-medium leading-snug text-foreground">{row.thesisTitle || '-'}</p>
      ),
    },
  ], []);

  const filtered = useMemo(() => {
    if (!announcements) return [];
    const q = search.toLowerCase().trim();

    return announcements
      .map((item) => {
        if (!q) return item;

        const sortParticipants = (participants: typeof item.participants) =>
          [...participants].sort((a, b) => {
            const aTime = a.registeredAt ? new Date(a.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.registeredAt ? new Date(b.registeredAt).getTime() : Number.MAX_SAFE_INTEGER;
            if (aTime !== bTime) return aTime - bTime;
            return a.studentName.localeCompare(b.studentName);
          });

        const eventMatches = item.name.toLowerCase().includes(q);
        const participants = eventMatches
          ? sortParticipants(item.participants)
          : sortParticipants(item.participants.filter((participant) =>
            participant.studentName.toLowerCase().includes(q) ||
            participant.studentNim.toLowerCase().includes(q) ||
            participant.thesisTitle.toLowerCase().includes(q)
          ));

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengumuman Hasil Yudisium</h1>
        <p className="text-muted-foreground">
          Daftar mahasiswa yang telah ditetapkan sebagai peserta yudisium
        </p>
      </div>

      <SearchField value={search} onChange={setSearch} placeholder="Cari nama mahasiswa, NIM, atau judul TA..." />

      {paginatedAnnouncements.length === 0 ? (
        <EmptyState
          title={search ? 'Tidak Ditemukan' : 'Belum Ada Pengumuman'}
          description={search ? 'Tidak ditemukan pengumuman yang sesuai pencarian' : 'Belum ada pengumuman hasil yudisium'}
        />
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
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-foreground" />
                      {formatDateHeader(item.eventDate)}
                    </span>
                    {item.room && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-foreground" />
                        {item.room.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-foreground" />
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
                  className="border border-gray-200 rounded-lg overflow-hidden"
                />

                {item.notes && (
                  <div className="rounded-md border border-gray-200 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Catatan: </span>
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {sortedAnnouncements.length > 0 && (
        <ListPagination total={sortedAnnouncements.length} page={currentPage} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
