import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireFcmToken, getFirebaseMessaging, onMessage } from "@/config/firebase";
import { registerFcmToken } from "@/services/notification.service";
import { useAuth } from "@/hooks/shared";
import { getAuthTokens } from "@/services/auth.service";

// Key untuk menyimpan FCM token di localStorage (shared dengan useAuth)
const FCM_TOKEN_KEY = 'fcm_token';

type PushEventType =
  | "thesis-guidance:requested"
  | "thesis-guidance:approved"
  | "thesis-guidance:rejected"
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
        console.log("[FCM] Notification permission:", permission);
        if (permission !== "granted") {
          console.warn("[FCM] Notification permission not granted");
          return;
        }
        const token = await acquireFcmToken();
        if (!token) {
          console.error("[FCM] Failed to acquire FCM token");
          return;
        }
        tokenRef.current = token;
        // Store token in localStorage so useAuth can unregister it on logout
        localStorage.setItem(FCM_TOKEN_KEY, token);
        console.log("[FCM] acquired token", token.length > 12 ? `${token.slice(0, 6)}...${token.slice(-6)}` : token);
        await registerFcmToken(token);
        console.log("[FCM] token registered with backend");
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload: any) => {
          try {
            console.log("[FCM] ========== FOREGROUND MESSAGE RECEIVED ==========");
            console.log("[FCM] Full payload:", JSON.stringify(payload, null, 2));
            console.log("[FCM] payload.data:", payload?.data);
            console.log("[FCM] payload.notification:", payload?.notification);
            
            const type = payload?.data?.type as PushEventType;
            const role = payload?.data?.role;
            
            console.log("[FCM] Extracted type:", type);
            console.log("[FCM] Extracted role:", role);
            console.log("[FCM] Type is thesis-guidance:approved?", type === "thesis-guidance:approved");
            console.log("[FCM] Type is thesis-guidance:rejected?", type === "thesis-guidance:rejected");
            
            switch (type) {
              case "thesis-guidance:requested": {
                if (role === "supervisor") {
                  const when = payload?.data?.requestedDateFormatted || payload?.data?.requestedDate || "";
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
                const when = payload?.data?.requestedDateFormatted || payload?.data?.requestedDate || "";
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
              case "thesis-guidance:approved": {
                console.log("[FCM] ✅ Matched case: thesis-guidance:approved");
                const title = payload?.notification?.title || "Bimbingan Disetujui ✓";
                const body = payload?.notification?.body || "Permintaan bimbingan Anda telah disetujui";
                console.log("[FCM] Calling toast with title:", title, "body:", body);
                toast(title, { description: body, duration: 5000 });
                console.log("[FCM] Toast called successfully");
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:rejected": {
                console.log("[FCM] ❌ Matched case: thesis-guidance:rejected");
                const title = payload?.notification?.title || "Bimbingan Ditolak";
                const body = payload?.notification?.body || "Permintaan bimbingan Anda ditolak";
                console.log("[FCM] Calling toast.error with title:", title, "body:", body);
                toast.error(title, { description: body, duration: 5000 });
                console.log("[FCM] Toast.error called successfully");
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
              default: {
                // Fallback: show generic notification toast if type doesn't match
                console.warn("[FCM] Unknown notification type:", type);
                const title = payload?.notification?.title || "Notifikasi Baru";
                const body = payload?.notification?.body || "";
                if (title || body) {
                  toast(title, { description: body, duration: 5000 });
                  qc.invalidateQueries({ queryKey: ["student-guidance"] });
                  qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                }
                break;
              }
            }
          } catch (err) {
            console.error("[FCM] Error handling message:", err);
          }
        });

        // Also listen to messages forwarded from Service Worker
        if (navigator?.serviceWorker) {
          swListener = (event: MessageEvent) => {
            try {
              const msg: any = event?.data || {};
              if (!msg || msg.__from !== 'fcm-sw') return;
              console.log('[FCM SW] ========== MESSAGE FROM SERVICE WORKER ==========');
              console.log('[FCM SW] Full message:', JSON.stringify(msg, null, 2));
              console.log('[FCM SW] msg.data:', msg?.data);
              console.log('[FCM SW] msg.title:', msg?.title);
              console.log('[FCM SW] msg.body:', msg?.body);
              
              const type = msg?.data?.type as PushEventType;
              const role = msg?.data?.role;
              
              console.log('[FCM SW] Extracted type:', type);
              console.log('[FCM SW] Extracted role:', role);
              console.log('[FCM SW] Type is thesis-guidance:approved?', type === 'thesis-guidance:approved');
              console.log('[FCM SW] Type is thesis-guidance:rejected?', type === 'thesis-guidance:rejected');
              switch (type) {
                case 'thesis-guidance:requested': {
                  if (role === 'supervisor') {
                    const when = msg?.data?.requestedDateFormatted || msg?.data?.requestedDate || '';
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
                  const when = msg?.data?.requestedDateFormatted || msg?.data?.requestedDate || '';
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
                case 'thesis-guidance:approved': {
                  console.log("[FCM SW] ✅ Matched case: thesis-guidance:approved");
                  const title = msg?.title || "Bimbingan Disetujui ✓";
                  const body = msg?.body || "Permintaan bimbingan Anda telah disetujui";
                  console.log("[FCM SW] Calling toast with title:", title, "body:", body);
                  toast(title, { description: body, duration: 5000 });
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'thesis-guidance:rejected': {
                  console.log("[FCM SW] ❌ Matched case: thesis-guidance:rejected");
                  const title = msg?.title || "Bimbingan Ditolak";
                  const body = msg?.body || "Permintaan bimbingan Anda ditolak";
                  console.log("[FCM SW] Calling toast.error with title:", title, "body:", body);
                  toast.error(title, { description: body, duration: 5000 });
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
      // Note: FCM token unregistration is handled by useAuth.logout()
      // to ensure it's called before auth token is invalidated
    };
  }, [qc, isLoggedIn]);
}
