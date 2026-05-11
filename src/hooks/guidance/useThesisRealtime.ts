import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ThesisPushEventType =
  | "thesis-guidance:requested"
  | "thesis-guidance:approved"
  | "thesis-guidance:rejected"
  | "thesis-guidance:rescheduled"
  | "thesis-guidance:cancelled"
  | "thesis-guidance:notes-updated"
  | "thesis-guidance:summary-submitted"
  | "thesis-guidance:summary-approved"
  | "supervisor2_request"
  | "supervisor2_approved"
  | "supervisor2_rejected"
  | "role_promotion";

export function useThesisRealtimeHandlers() {
  const qc = useQueryClient();

  const handleThesisMessage = (payload: any, playBeep: () => void) => {
    const type = payload?.data?.type as ThesisPushEventType;
    const role = payload?.data?.role;

    switch (type) {
      case "thesis-guidance:requested": {
        if (role === "supervisor") {
          const when = payload?.data?.requestedDateFormatted || payload?.data?.requestedDate || "";
          const msg = when ? `Permintaan bimbingan baru • ${when}` : "Permintaan bimbingan baru";
          toast(msg, { id: "guidance-requested" });
          if (payload?.data?.playSound === "true") playBeep();
          qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        } else {
          qc.invalidateQueries({ queryKey: ["student-guidance"] });
        }
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:rescheduled": {
        const when = payload?.data?.requestedDateFormatted || payload?.data?.requestedDate || "";
        const msg = when ? `Jadwal bimbingan diperbarui • ${when}` : "Jadwal bimbingan diperbarui";
        toast(msg, { id: "guidance-rescheduled" });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:cancelled": {
        toast("Bimbingan dibatalkan", { id: "guidance-cancelled" });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:approved": {
        const title = payload?.notification?.title || "Bimbingan Disetujui ✓";
        const body = payload?.notification?.body || "Permintaan bimbingan Anda telah disetujui";
        toast(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:rejected": {
        const title = payload?.notification?.title || "Bimbingan Ditolak";
        const body = payload?.notification?.body || "Permintaan bimbingan Anda ditolak";
        toast.error(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:notes-updated": {
        toast("Catatan bimbingan diperbarui", { id: "guidance-notes-updated" });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:summary-submitted": {
        if (role === "supervisor") {
          const studentName = payload?.data?.studentName || "Mahasiswa";
          toast.info("Catatan Bimbingan Baru", {
            description: `${studentName} telah mengisi catatan bimbingan`,
            id: "guidance-summary-submitted",
            duration: 5000,
          });
          if (payload?.data?.playSound === "true") playBeep();
          qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
          qc.invalidateQueries({ queryKey: ["pending-approval"] });
        }
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "thesis-guidance:summary-approved": {
        if (role === "student") {
          const title = payload?.data?.title || "Catatan Bimbingan Disetujui ✓";
          const body = payload?.data?.body || "Catatan bimbingan Anda telah disetujui. Bimbingan selesai!";
          toast.success(title, {
            description: body,
            id: "guidance-summary-approved",
            duration: 5000,
          });
          qc.invalidateQueries({ queryKey: ["student-guidance"] });
          qc.invalidateQueries({ queryKey: ["needs-summary"] });
          qc.invalidateQueries({ queryKey: ["completed-history"] });
        }
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      case "supervisor2_request":
      case "supervisor2_approved":
      case "supervisor2_rejected":
      case "role_promotion": {
        const title = payload?.data?.title || payload?.notification?.title || "Notifikasi Baru";
        const body = payload?.data?.body || payload?.notification?.body || "";
        toast(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      default:
        return false;
    }
  };

  const handleThesisBackgroundMessage = (msg: any, playBeep: () => void) => {
    const type = msg?.data?.type as ThesisPushEventType;
    const role = msg?.data?.role;

    switch (type) {
      case 'thesis-guidance:requested': {
        if (role === 'supervisor') {
          const when = msg?.data?.requestedDateFormatted || msg?.data?.requestedDate || '';
          const t = when ? `Permintaan bimbingan baru • ${when}` : 'Permintaan bimbingan baru';
          toast(t, { id: 'guidance-requested' });
          if (msg?.data?.playSound === 'true') playBeep();
          qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
        } else {
          qc.invalidateQueries({ queryKey: ['student-guidance'] });
        }
        qc.invalidateQueries({ queryKey: ['notification-unread'] });
        return true;
      }
      case 'thesis-guidance:rescheduled':
      case 'thesis-guidance:cancelled':
      case 'thesis-guidance:approved':
      case 'thesis-guidance:rejected':
      case 'thesis-guidance:notes-updated': {
        qc.invalidateQueries({ queryKey: ['student-guidance'] });
        qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
        qc.invalidateQueries({ queryKey: ['notification-unread'] });
        return true;
      }
      case "supervisor2_request":
      case "supervisor2_approved":
      case "supervisor2_rejected":
      case "role_promotion": {
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }
      default:
        return false;
    }
  };

  return { handleThesisMessage, handleThesisBackgroundMessage };
}
