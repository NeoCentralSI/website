import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireFcmToken, getFirebaseMessaging, onMessage } from "@/config/firebase";
import { registerFcmToken } from "@/services/notification.service";
import { useAuth } from "@/hooks/shared";
import { useInternshipRealtimeHandlers, type InternshipPushEventType } from "@/hooks/internship/useInternshipRealtime";
import { useThesisRealtimeHandlers, type ThesisPushEventType } from "@/hooks/guidance/useThesisRealtime";

// Key untuk menyimpan FCM token di localStorage (shared dengan useAuth)
const FCM_TOKEN_KEY = 'fcm_token';
const FCM_REGISTRATION_KEY = 'fcm_registration';

type PushEventType =
  | ThesisPushEventType
  | InternshipPushEventType;

export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { isLoggedIn, user } = useAuth();
  const { handleInternshipMessage, handleInternshipBackgroundMessage } = useInternshipRealtimeHandlers();
  const { handleThesisMessage, handleThesisBackgroundMessage } = useThesisRealtimeHandlers();

  function showBrowserNotification(payload: any) {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const title = payload?.data?.title || payload?.notification?.title || "Notifikasi Baru";
      const body = payload?.data?.body || payload?.notification?.body || "";
      if (!title && !body) return;

      navigator.serviceWorker?.ready
        .then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/vite.svg",
            badge: "/vite.svg",
            data: payload?.data || {},
          });
        })
        .catch(() => {
          new Notification(title, { body, data: payload?.data || {} });
        });
    } catch {
      // Native notification is best-effort; toast handling still runs below.
    }
  }

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
        ctx.resume().catch(() => { });
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

  // Handle FCM token registration
  const setupFcm = useCallback(async () => {
    if (!isLoggedIn || !user) return false;

    try {
      if (!("Notification" in window)) return false;
      if (Notification.permission === "denied") return false;

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;
      }

      const token = await acquireFcmToken();
      if (!token) return false;

      const registrationKey = `${user.id}:${token}`;
      await registerFcmToken(token, "web");
      localStorage.setItem(FCM_TOKEN_KEY, token);
      localStorage.setItem(FCM_REGISTRATION_KEY, registrationKey);
      return true;
    } catch (error) {
      console.error("[FCM] setup failed:", error);
      return false;
    }
  }, [isLoggedIn, user]);

  const fcmSetupCalled = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !fcmSetupCalled.current) {
      fcmSetupCalled.current = true;
      setupFcm().then((ok) => {
        if (!ok) fcmSetupCalled.current = false;
      });
    } else if (!isLoggedIn) {
      fcmSetupCalled.current = false;
    }
  }, [isLoggedIn, setupFcm]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let unsubscribe: (() => void) | null = null;
    let swListener: ((event: MessageEvent) => void) | null = null;

    async function setupMessageListeners() {
      try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload: any) => {
          try {
            showBrowserNotification(payload);
            const type = payload?.data?.type as PushEventType;

            switch (type) {
              case "thesis-guidance:requested":
              case "thesis-guidance:rescheduled":
              case "thesis-guidance:cancelled":
              case "thesis-guidance:approved":
              case "thesis-guidance:rejected":
              case "thesis-guidance:notes-updated":
              case "thesis-guidance:summary-submitted":
              case "thesis-guidance:summary-approved":
              case "supervisor2_request":
              case "supervisor2_approved":
              case "supervisor2_rejected":
              case "role_promotion": {
                handleThesisMessage(payload, playBeep);
                break;
              }
              case "internship_invitation":
              case "internship_invitation_response":
              case "internship_new_proposal":
              case "internship_proposal_response":
              case "internship_company_response":
              case "internship_company_response_rejected_sekdep":
              case "internship_proposal_accepted":
              case "internship_proposal_partially_accepted":
              case "internship_proposal_rejected_company":
              case "internship_supervisor_assigned":
              case "internship_guidance:submitted":
              case "internship_guidance:approved":
              case "internship_reporting_document_uploaded":
              case "internship_document_verification":
              case "internship_final_report_uploaded":
              case "internship_final_report_verification":
              case "internship_seminar_scheduled":
              case "internship_seminar_reminder":
              case "internship_grading_completed":
              case "internship_lecturer_assignment_generated":
              case "internship_supervisor_letter_signed": {
                handleInternshipMessage(payload, playBeep);
                break;
              }
              default: {
                console.warn("[FCM] Unknown notification type:", type);
                const title = payload?.data?.title || payload?.notification?.title || "Notifikasi Baru";
                const body = payload?.data?.body || payload?.notification?.body || "";
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

        if (navigator?.serviceWorker) {
          swListener = (event: MessageEvent) => {
            try {
              const msg: any = event?.data || {};
              if (!msg || msg.__from !== 'fcm-sw') return;

              const type = msg?.data?.type as PushEventType;

              switch (type) {
                case 'thesis-guidance:requested':
                case 'thesis-guidance:rescheduled':
                case 'thesis-guidance:cancelled':
                case 'thesis-guidance:approved':
                case 'thesis-guidance:rejected':
                case 'thesis-guidance:notes-updated':
                case 'thesis-guidance:summary-submitted':
                case 'thesis-guidance:summary-approved':
                case "supervisor2_request":
                case "supervisor2_approved":
                case "supervisor2_rejected":
                case "role_promotion": {
                  handleThesisBackgroundMessage(msg, playBeep);
                  break;
                }
                case 'internship_guidance:submitted':
                case 'internship_guidance:approved':
                case "internship_reporting_document_uploaded":
                case "internship_document_verification":
                case "internship_final_report_uploaded":
                case "internship_final_report_verification":
                case "internship_invitation":
                case "internship_invitation_response":
                case "internship_proposal_response":
                case "internship_proposal_accepted":
                case "internship_proposal_partially_accepted":
                case "internship_proposal_rejected_company":
                case "internship_company_response_rejected_sekdep":
                case "internship_new_proposal":
                case "internship_company_response":
                case "internship_seminar_scheduled":
                case "internship_seminar_response":
                case "internship_seminar_completed":
                case "internship_seminar_audience_validated":
                case "internship_seminar_reminder":
                case "internship_grading_completed":
                case "internship_completed":
                case "internship_status_failed":
                case "internship_proposal_approved_admin":
                case "internship_supervisor_assigned":
                case "internship_document_bulk_verification":
                case "internship_final_report_rejected":
                case "internship_field_assessment_completed":
                case "internship_lecturer_assignment_generated":
                case "internship_supervisor_letter_signed": {
                  const title = msg?.title || msg?.data?.title || "Notifikasi Kerja Praktik";
                  const body = msg?.body || msg?.data?.body || "";
                  toast(title, { description: body, duration: 5000 });
                  handleInternshipBackgroundMessage(msg);
                  break;
                }
                default:
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
              }
            } catch { }
          };
          navigator.serviceWorker.addEventListener('message', swListener as unknown as EventListener);
        }
      } catch (e) {
        console.error("[FCM] Listener setup error:", e);
      }
    }

    setupMessageListeners();

    const unlock = () => {
      try {
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state === "suspended") ctx.resume().catch(() => { });
      } catch { }
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      if (unsubscribe) unsubscribe();
      if (navigator?.serviceWorker && swListener) {
        navigator.serviceWorker.removeEventListener('message', swListener as unknown as EventListener);
      }
      document.removeEventListener("click", unlock as any);
      document.removeEventListener("keydown", unlock as any);
      try {
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") audioCtxRef.current.close();
      } catch { }
    };
  }, [qc, isLoggedIn]);
}
