import { useEffect, useRef } from "react";
import { API_CONFIG } from "@/config/api";
import { getAuthTokens } from "@/services/auth.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type GuidanceWsEventType =
  | "thesis-guidance:requested"
  | "thesis-guidance:rescheduled"
  | "thesis-guidance:cancelled"
  | "thesis-guidance:notes-updated"
  | "ws:connected";

type WsMessage = { type: GuidanceWsEventType; data?: any };

function buildWsUrl(token: string) {
  const base = (API_CONFIG.BASE_URL || "").replace(/\/$/, "");
  const wsBase = base.startsWith("https")
    ? base.replace(/^https/, "wss")
    : base.replace(/^http/, "ws");
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}

export function useGuidanceRealtime() {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnect = useRef(true);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
  const { accessToken } = getAuthTokens();
  if (!accessToken) return;

    function connect() {
      // Avoid duplicate sockets
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
  const url = buildWsUrl(accessToken as string);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // Connected
      };

      ws.onmessage = (evt) => {
        try {
          const msg: WsMessage = JSON.parse(evt.data);
          const role = msg?.data?.role as string | undefined; // 'student' | 'supervisor'
          switch (msg.type) {
            case "thesis-guidance:requested": {
              // Student: avoid duplicate success toast (form already shows it)
              // Lecturer (supervisor): show incoming request toast
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
              // Invalidate both sides to be safe
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
              // no need to refetch list every time, but keep consistent
              qc.invalidateQueries({ queryKey: ["student-guidance"] });
              qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
              qc.invalidateQueries({ queryKey: ["notification-unread"] });
              break;
            }
            case "ws:connected":
            default:
              break;
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!shouldReconnect.current) return;
        if (retryTimer.current) clearTimeout(retryTimer.current);
        // simple retry after 2s
        retryTimer.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    }

    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
    };
  }, [qc]);
}
