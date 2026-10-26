import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { CalendarDashboard } from "@/components/layout/CalendarDashboard";
import type { CalendarEvent } from "@/types/calendar.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UpcomingEventsCard } from "@/components/dashboard/UpcomingEventsCard";
import { CalendarEventDialog } from "@/components/dashboard/CalendarEventDialog";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { useRole } from "@/hooks/shared/useRole";
import { getUpcomingSeminars } from "@/services/internship";
import type { UpcomingSeminarItem } from "@/services/internship";

const getSeminarDatePart = (date: string) => {
  return date?.split("T")[0] || new Date().toISOString().split("T")[0];
};

const getSeminarTimePart = (time: string) => {
  if (!time) return "00:00:00";

  const parsed = new Date(time);
  if (!Number.isNaN(parsed.getTime())) {
    const hours = parsed.getUTCHours().toString().padStart(2, "0");
    const minutes = parsed.getUTCMinutes().toString().padStart(2, "0");
    const seconds = parsed.getUTCSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  const match = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) return `${match[1]}:${match[2]}:${match[3] || "00"}`;

  return "00:00:00";
};

const buildSeminarDateTime = (date: string, time: string) => {
  return `${getSeminarDatePart(date)}T${getSeminarTimePart(time)}`;
};

const mapInternshipSeminarToCalendarEvent = (
  seminar: UpcomingSeminarItem,
  userRole: CalendarEvent["userRole"]
): CalendarEvent => {
  const student = seminar.internship?.student?.user;
  const studentName = student?.fullName || "Mahasiswa";
  const companyName = seminar.internship?.proposal?.targetCompany?.companyName;
  const supervisorName = seminar.internship?.supervisor?.user?.fullName;
  const moderatorName = seminar.moderatorStudent?.user?.fullName;
  const status = seminar.status === "REJECTED"
    ? "rejected"
    : seminar.status === "REQUESTED"
      ? "requested"
      : "accepted";
  const now = new Date().toISOString();

  return {
    id: `internship-seminar-${seminar.id}`,
    title: `Seminar KP - ${studentName}`,
    description: companyName
      ? `Seminar Kerja Praktik di ${companyName}`
      : "Seminar Kerja Praktik",
    type: "internship_seminar",
    status,
    startDate: buildSeminarDateTime(seminar.seminarDate, seminar.startTime),
    endDate: buildSeminarDateTime(seminar.seminarDate, seminar.endTime),
    userId: "",
    userRole,
    relatedId: seminar.id,
    relatedType: "seminar",
    participants: [
      { userId: "", name: studentName, role: "student" as const },
      ...(supervisorName ? [{ userId: "", name: supervisorName, role: "lecturer" as const }] : []),
      ...(moderatorName ? [{ userId: "", name: moderatorName, role: "moderator" as const }] : []),
    ],
    location: seminar.room?.location
      ? `${seminar.room.name} - ${seminar.room.location}`
      : seminar.room?.name,
    meetingLink: seminar.linkMeeting,
    createdAt: now,
    updatedAt: now,
    createdBy: "internship",
  };
};

export default function Dashboard() {

  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const { isDosen, isStudent, isKadep, isPembimbing, isAdmin } = useRole();
  const isLecturer = isDosen();
  const isStudentUser = isStudent();
  const showQuickActions = isAdmin() || isKadep() || isPembimbing();

  const {
    data: upcomingInternshipSeminars = [],
    isFetching: isFetchingInternshipSeminars,
    refetch: refetchInternshipSeminars,
  } = useQuery<UpcomingSeminarItem[]>({
    queryKey: ["upcoming-seminars"],
    queryFn: getUpcomingSeminars,
    enabled: isStudentUser,
    staleTime: 2 * 60 * 1000,
  });

  const internshipSeminarEvents = useMemo(() => {
    const userRole: CalendarEvent["userRole"] = isLecturer ? "lecturer" : "student";
    return upcomingInternshipSeminars.map((seminar) =>
      mapInternshipSeminarToCalendarEvent(seminar, userRole)
    );
  }, [isLecturer, upcomingInternshipSeminars]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCreateEvent = () => {
    setCreateEventOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col h-[calc(100vh-4rem)] overflow-hidden p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
        <div className="lg:col-span-2 h-full min-h-0">
          {/* Calendar Only */}
          <CalendarDashboard
            onEventClick={handleEventClick}
            onCreateEvent={handleCreateEvent}
            extraEvents={internshipSeminarEvents}
            isLoadingExtraEvents={isFetchingInternshipSeminars}
            onRefreshExtraEvents={isStudentUser ? refetchInternshipSeminars : undefined}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-1 h-full min-h-0 flex flex-col gap-6">
          {showQuickActions && <QuickActionsCard className="shrink-0" />}
          <UpcomingEventsCard
            onEventClick={handleEventClick}
            extraEvents={internshipSeminarEvents}
            isLoadingExtraEvents={isFetchingInternshipSeminars}
            className="flex-1 min-h-0"
          />
        </div>
      </div>

      <CalendarEventDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Create Event Dialog - Placeholder */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Event Baru</DialogTitle>
            <DialogDescription>
              Fitur ini akan segera tersedia
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Form untuk membuat event custom akan ditambahkan di sini</p>
          </div>
          <Button variant="outline" onClick={() => setCreateEventOpen(false)}>
            Tutup
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
