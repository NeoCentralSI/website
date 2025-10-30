import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireFcmToken, getFirebaseMessaging, onMessage } from "@/config/firebase";
import { registerFcmToken, unregisterFcmToken } from "@/services/notification.service";
import { useAuth } from "./useAuth";

type PushEventType =
  | "thesis-guidance:requested"
  | "thesis-guidance:rescheduled"
  | "thesis-guidance:cancelled"
  | "thesis-guidance:notes-updated";

export function useGuidanceRealtime() {
  const qc = useQueryClient();
  const tokenRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { isLoggedIn } = useAuth();

  function playBeep() {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current as AudioContext | null;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        // try to resume (requires user gesture in some browsers)
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880; // A5
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // ignore audio errors
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    let unsubscribe: (() => void) | null = null;
    let swListener: ((event: MessageEvent) => void) | null = null;

    async function setup() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const token = await acquireFcmToken();
        if (!token) return;
        tokenRef.current = token;
        console.log("[FCM] acquired token", token.length > 12 ? `${token.slice(0, 6)}...${token.slice(-6)}` : token);
        await registerFcmToken(token);
        console.log("[FCM] token registered with backend");
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload: any) => {
          try {
            console.log("[FCM] onMessage payload", payload);
            const type = (payload?.data?.type as PushEventType) || (payload?.notification?.title as PushEventType);
            const role = payload?.data?.role;
            switch (type) {
              case "thesis-guidance:requested": {
                if (role === "supervisor") {
                  const when = payload?.data?.scheduledAtFormatted || payload?.data?.scheduledAt || "";
                  const msg = when ? `Permintaan bimbingan baru • ${when}` : "Permintaan bimbingan baru";
                  toast(msg, { id: "guidance-requested" });
                  if (payload?.data?.playSound === "true") {
                    console.log("[FCM] play beep");
                    playBeep();
                  }
                  qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                } else {
                  qc.invalidateQueries({ queryKey: ["student-guidance"] });
                }
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:rescheduled": {
                const when = payload?.data?.scheduledAtFormatted || payload?.data?.scheduledAt || "";
                const msg = when ? `Jadwal bimbingan diperbarui • ${when}` : "Jadwal bimbingan diperbarui";
                toast(msg, { id: "guidance-rescheduled" });
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

        // Also listen to messages forwarded from Service Worker
        if (navigator?.serviceWorker) {
          swListener = (event: MessageEvent) => {
            try {
              const msg: any = event?.data || {};
              if (!msg || msg.__from !== 'fcm-sw') return;
              console.log('[FCM] SW message', msg);
              const type = (msg?.data?.type as PushEventType) || (msg?.title as PushEventType);
              const role = msg?.data?.role;
              switch (type) {
                case 'thesis-guidance:requested': {
                  if (role === 'supervisor') {
                    const when = msg?.data?.scheduledAtFormatted || msg?.data?.scheduledAt || '';
                    const t = when ? `Permintaan bimbingan baru • ${when}` : 'Permintaan bimbingan baru';
                    toast(t, { id: 'guidance-requested' });
                    if (msg?.data?.playSound === 'true') {
                      playBeep();
                    }
                    qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  } else {
                    qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  }
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'thesis-guidance:rescheduled': {
                  const when = msg?.data?.scheduledAtFormatted || msg?.data?.scheduledAt || '';
                  const t = when ? `Jadwal bimbingan diperbarui • ${when}` : 'Jadwal bimbingan diperbarui';
                  toast(t, { id: 'guidance-rescheduled' });
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'thesis-guidance:cancelled': {
                  toast('Bimbingan dibatalkan', { id: 'guidance-cancelled' });
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'thesis-guidance:notes-updated': {
                  toast('Catatan bimbingan diperbarui', { id: 'guidance-notes-updated' });
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                default:
                  break;
              }
            } catch {}
          };
          navigator.serviceWorker.addEventListener('message', swListener as unknown as EventListener);
        }
      } catch {
        // ignore
      }
    }

    setup();

    // Try to unlock/resume audio context on first user interaction
    const unlock = () => {
      try {
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      } catch {}
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      if (unsubscribe) unsubscribe();
      const tok = tokenRef.current;
      tokenRef.current = null;
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
      } catch {}
      if (navigator?.serviceWorker && swListener) {
        navigator.serviceWorker.removeEventListener('message', swListener as unknown as EventListener);
      }
      document.removeEventListener("click", unlock as any);
      document.removeEventListener("keydown", unlock as any);
      if (tok) {
        unregisterFcmToken(tok).catch(() => {});
      }
    };
  }, [qc, isLoggedIn]);
}
