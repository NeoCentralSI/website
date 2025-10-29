import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireFcmToken, getFirebaseMessaging, onMessage } from "@/config/firebase";
import { registerFcmToken, unregisterFcmToken } from "@/services/notification.service";

type PushEventType =
  | "thesis-guidance:requested"
  | "thesis-guidance:rescheduled"
  | "thesis-guidance:cancelled"
  | "thesis-guidance:notes-updated";

export function useGuidanceRealtime() {
  const qc = useQueryClient();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
  let unsubscribe: (() => void) | null = null;

    async function setup() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const token = await acquireFcmToken();
        if (!token) return;
        tokenRef.current = token;
        await registerFcmToken(token);
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
  unsubscribe = onMessage(messaging, (payload: any) => {
          try {
            const type = (payload?.data?.type as PushEventType) || (payload?.notification?.title as PushEventType);
            const role = payload?.data?.role;
            switch (type) {
              case "thesis-guidance:requested": {
                if (role === "supervisor") {
                  toast("Permintaan bimbingan baru", { id: "guidance-requested" });
                  qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                } else {
                  qc.invalidateQueries({ queryKey: ["student-guidance"] });
                }
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:rescheduled": {
                toast("Jadwal bimbingan diperbarui", { id: "guidance-rescheduled" });
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:cancelled": {
                toast("Bimbingan dibatalkan", { id: "guidance-cancelled" });
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:notes-updated": {
                toast("Catatan bimbingan diperbarui", { id: "guidance-notes-updated" });
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              default:
                break;
            }
          } catch {}
        });
      } catch {
        // ignore
      }
    }

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
      const tok = tokenRef.current;
      tokenRef.current = null;
      if (tok) {
        unregisterFcmToken(tok).catch(() => {});
      }
    };
  }, [qc]);
}
