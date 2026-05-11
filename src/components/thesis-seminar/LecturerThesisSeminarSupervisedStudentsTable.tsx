import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '@/components/layout/CustomTable';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSupervisedStudentSeminars } from '@/hooks/thesis-seminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { ThesisEventTitleCell } from '@/components/shared/ThesisTableCells';
import { Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { SupervisedStudentSeminarItem } from '@/types/seminar.types';

export function LecturerThesisSeminarSupervisedStudentsTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: seminars, isLoading, isFetching, error, refetch } = useSupervisedStudentSeminars();

  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data mahasiswa bimbingan');
    }
  }, [error]);

  const filteredData = useMemo(() => {
    if (!seminars) return [];
    let result = [...seminars];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.studentName.toLowerCase().includes(q) ||
          item.studentNim.toLowerCase().includes(q) ||
          item.thesisTitle.toLowerCase().includes(q)
      );
    }

    const statusOrder: Record<string, number> = {
      ongoing: 1,
      passed_with_revision: 2,
      scheduled: 3,
      examiner_assigned: 4,
      verified: 5,
      registered: 6,
      passed: 7,
      failed: 8,
      cancelled: 9,
    };

    result.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;

      // Tie-breakers for same status
      const hasSchedule = ['ongoing', 'passed', 'passed_with_revision', 'failed', 'scheduled'].includes(a.status);
      if (hasSchedule) {
        const getScheduleTime = (item: SupervisedStudentSeminarItem) => {
          if (!item.date) return 0;
          const dateStr = item.date.includes('T') ? item.date.split('T')[0] : item.date;
          let timeStr = '00:00';
          if (item.startTime) {
            if (item.startTime.includes('T')) {
              const d = new Date(item.startTime);
              timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
            } else {
              timeStr = item.startTime.slice(0, 5);
            }
          }
          return new Date(`${dateStr}T${timeStr}:00`).getTime();
        };

        const timeA = getScheduleTime(a);
        const timeB = getScheduleTime(b);
        if (timeA !== timeB) return timeB - timeA; // Descending
      } else {
        const getRegisteredTime = (item: SupervisedStudentSeminarItem) => {
          if (!item.registeredAt) return 0;
          return new Date(item.registeredAt).getTime();
        };

        const timeA = getRegisteredTime(a);
        const timeB = getRegisteredTime(b);
        if (timeA !== timeB) return timeB - timeA; // Descending
      }

      // Alphabetical by name
      return a.studentName.localeCompare(b.studentName);
    });

    return result;
  }, [seminars, search]);

  const total = filteredData.length;

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns: Column<SupervisedStudentSeminarItem>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 300,
      render: (row) => (
        <ThesisEventTitleCell
          title={row.thesisTitle}
          studentName={row.studentName}
          studentNim={row.studentNim}
        />
      ),
    },
    {
      key: 'myRole',
      header: 'Peran Saya',
      width: 220,
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {formatRoleName(row.myRole)}
        </Badge>
      ),
    },
    {
      key: 'examiners',
      header: 'Penguji',
      width: 240,
      render: (row) => {
        if (row.examiners.length === 0) {
          return <span className="text-sm text-muted-foreground italic">-</span>;
        }
        return (
          <div className="space-y-1 text-sm leading-snug text-foreground">
            {row.examiners.map((e, idx) => {
              let StatusIcon = Clock;
              let iconColor = 'text-amber-500';
              if (e.availabilityStatus === 'available') {
                StatusIcon = CheckCircle2;
                iconColor = 'text-emerald-600';
              } else if (e.availabilityStatus === 'unavailable') {
                StatusIcon = XCircle;
                iconColor = 'text-red-600';
              }
              return (
                <div key={e.id} className="flex items-center gap-1.5 truncate" title={`${idx + 1}. ${toTitleCaseName(e.lecturerName)}`}>
                  <span>{idx + 1}. {toTitleCaseName(e.lecturerName)}</span>
                  <StatusIcon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status Seminar',
      width: 160,
      render: (row) => (
        <ThesisEventStatusBadge
          status={row.status}
          scheduledDate={row.date}
          startTime={row.startTime}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-center',
      width: 100,
      render: (row) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/tugas-akhir/seminar-hasil/${row.id}`)}
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CustomTable<SupervisedStudentSeminarItem>
      columns={columns}
      data={pagedData}
      loading={isLoading}
      isRefreshing={isFetching && !isLoading}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      searchValue={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      emptyText="Belum ada mahasiswa bimbingan yang mendaftar seminar hasil."
      rowKey={(row) => row.id}
      actions={
        <RefreshButton
          onClick={() => refetch()}
          isRefreshing={isFetching && !isLoading}
        />
      }
    />
  );
}
