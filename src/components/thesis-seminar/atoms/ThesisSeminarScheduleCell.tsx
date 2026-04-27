import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * Shared UI Atom: ThesisSeminarScheduleCell
 * Renders date and room name consistently across all seminar tables.
 */

interface ThesisSeminarScheduleCellProps {
  date?: string | null;
  room?: { name: string } | null;
}

export function ThesisSeminarDateCell({ date }: Pick<ThesisSeminarScheduleCellProps, 'date'>) {
  if (!date) return <span className="text-muted-foreground">-</span>;
  try {
    return <>{format(new Date(date), 'd MMM yyyy', { locale: idLocale })}</>;
  } catch {
    return <span className="text-muted-foreground">-</span>;
  }
}

export function ThesisSeminarRoomCell({ room }: Pick<ThesisSeminarScheduleCellProps, 'room'>) {
  if (!room?.name) return <span className="text-muted-foreground">-</span>;
  return <>{room.name}</>;
}
