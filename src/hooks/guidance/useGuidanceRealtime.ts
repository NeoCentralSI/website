import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acquireFcmToken, getFirebaseMessaging, onMessage } from "@/config/firebase";
import { registerFcmToken } from "@/services/notification.service";
import { useAuth } from "@/hooks/shared";

// Key untuk menyimpan FCM token di localStorage (shared dengan useAuth)
const FCM_TOKEN_KEY = 'fcm_token';

type PushEventType =
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
  | "role_promotion"
  | "internship_invitation"
  | "internship_invitation_response"
  | "internship_new_proposal"
  | "internship_proposal_response"
  | "internship_company_response"
  | "internship_company_response_rejected_sekdep"
  | "internship_proposal_accepted"
  | "internship_proposal_partially_accepted"
  | "internship_proposal_rejected_company"
  | "internship_supervisor_assigned"
  | "internship_guidance:submitted"
  | "internship_guidance:approved"
  | "internship_reporting_document_uploaded"
  | "internship_document_verification"
  | "internship_final_report_uploaded"
  | "internship_final_report_verification"
  | "internship_seminar_scheduled"
  | "internship_seminar_reminder"
  | "internship_grading_completed"
  | "internship_lecturer_assignment_generated"
  | "internship_supervisor_letter_signed";

export function useGuidanceRealtime() {
  const qc = useQueryClient();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const { isLoggedIn, user } = useAuth();

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
    if (!isLoggedIn || !user) return;

    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "denied") return;

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      const token = await acquireFcmToken();
      if (!token) return;

      const registeredToken = localStorage.getItem(FCM_TOKEN_KEY);
      if (registeredToken === token) return;

      await registerFcmToken(token);
      localStorage.setItem(FCM_TOKEN_KEY, token);
    } catch {
      // Sliently fail in production
    }
  }, [isLoggedIn, user]);

  const fcmSetupCalled = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !fcmSetupCalled.current) {
      fcmSetupCalled.current = true;
      setupFcm();
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
            const type = payload?.data?.type as PushEventType;
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
                const title = payload?.notification?.title || "Bimbingan Disetujui ✓";
                const body = payload?.notification?.body || "Permintaan bimbingan Anda telah disetujui";
                toast(title, { description: body, duration: 5000 });
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["lecturer-requests"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "thesis-guidance:rejected": {
                const title = payload?.notification?.title || "Bimbingan Ditolak";
                const body = payload?.notification?.body || "Permintaan bimbingan Anda ditolak";
                toast.error(title, { description: body, duration: 5000 });
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
                break;
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
                break;
              }
              case "supervisor2_request":
              case "supervisor2_approved":
              case "supervisor2_rejected":
              case "role_promotion": {
                const title = payload?.data?.title || payload?.notification?.title || "Notifikasi Baru";
                const body = payload?.data?.body || payload?.notification?.body || "";
                toast(title, { description: body, duration: 5000 });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_invitation":
              case "internship_invitation_response":
              case "internship_proposal_response":
              case "internship_proposal_accepted":
              case "internship_proposal_partially_accepted":
              case "internship_proposal_rejected_company":
              case "internship_company_response_rejected_sekdep": {
                const title = payload?.notification?.title || payload?.data?.title || "Notifikasi Kerja Praktik";
                const body = payload?.notification?.body || payload?.data?.body || "";
                if (type === 'internship_company_response_rejected_sekdep') {
                  toast.error(title, { description: body, duration: 8000 });
                } else {
                  toast(title, { description: body, duration: 5000 });
                }
                qc.invalidateQueries({ queryKey: ["student-internship-proposals"] });
                qc.invalidateQueries({ queryKey: ["internship-proposal-detail"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_new_proposal":
              case "internship_company_response": {
                const title = payload?.notification?.title || payload?.data?.title || "Notifikasi Kerja Praktik";
                const body = payload?.notification?.body || payload?.data?.body || "";
                toast(title, { description: body, duration: 5000 });
                qc.invalidateQueries({ queryKey: ["sekdep-internship-proposals"] });
                qc.invalidateQueries({ queryKey: ["admin-internship-proposals"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_seminar_scheduled": {
                if (role === "lecturer" || role === "supervisor") {
                  const title = payload?.notification?.title || "Seminar KP Baru";
                  const body = payload?.notification?.body || "Mahasiswa telah menjadwalkan seminar KP";
                  toast.info(title, { description: body, duration: 8000 });
                  playBeep();
                  qc.invalidateQueries({ queryKey: ["lecturer-seminar-requests"] });
                }
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_seminar_reminder": {
                const title = payload?.notification?.title || "Pengingat Seminar KP";
                const body = payload?.notification?.body || "Seminar KP akan dimulai dalam 10 menit";
                toast.warning(title, { description: body, duration: 10000 });
                playBeep();
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_grading_completed": {
                if (role === "student") {
                  const title = payload?.notification?.title || "Penilaian Selesai";
                  const body = payload?.notification?.body || "Dosen pembimbing telah selesai melakukan penilaian KP";
                  toast.success(title, { description: body, duration: 8000 });
                  qc.invalidateQueries({ queryKey: ["student-internship-details"] });
                }
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_supervisor_assigned": {
                const title = payload?.notification?.title || payload?.data?.title || "Pembimbing KP Ditetapkan";
                const body = payload?.notification?.body || payload?.data?.body || "";
                toast.success(title, { description: body, duration: 5000 });
                qc.invalidateQueries({ queryKey: ["student-internship-details"] });
                qc.invalidateQueries({ queryKey: ["sekdep-lecturer-workload"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_guidance:submitted": {
                const title = payload?.notification?.title || "Bimbingan Baru";
                const body = payload?.notification?.body || "Mahasiswa telah mengunggah bimbingan";
                toast.info(title, { description: body, duration: 5000 });
                playBeep();
                qc.invalidateQueries({ queryKey: ["lecturer-student-guidance-timeline"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_lecturer_assignment_generated": {
                const title = payload?.notification?.title || payload?.data?.title || "Surat Tugas Pembimbing Baru";
                const body = payload?.notification?.body || payload?.data?.body || "";
                toast.info(title, { description: body, duration: 8000 });
                playBeep();
                qc.invalidateQueries({ queryKey: ["kadep-pending-letters"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_supervisor_letter_signed": {
                const title = payload?.notification?.title || payload?.data?.title || "Surat Tugas Pembimbing Ditandatangani ✓";
                const body = payload?.notification?.body || payload?.data?.body || "";
                toast.success(title, { description: body, duration: 8000 });
                playBeep();
                qc.invalidateQueries({ queryKey: ["lecturerSupervisedStudents"] });
                qc.invalidateQueries({ queryKey: ["lecturerSupervisorLetter"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_guidance:approved": {
                const title = payload?.notification?.title || "Bimbingan Dievaluasi";
                const body = payload?.notification?.body || "Bimbingan Anda telah dievaluasi oleh pembimbing";
                toast.success(title, { description: body, duration: 5000 });
                qc.invalidateQueries({ queryKey: ["student-guidance"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_reporting_document_uploaded": {
                const title = payload?.notification?.title || payload?.data?.title || "Dokumen Pelaporan Baru";
                const body = payload?.notification?.body || payload?.data?.body || "";
                toast.info(title, { description: body, duration: 5000 });
                playBeep();
                qc.invalidateQueries({ queryKey: ["sekdep-internships"] });
                qc.invalidateQueries({ queryKey: ["internship-detail"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_document_verification": {
                const title = payload?.notification?.title || payload?.data?.title || "Verifikasi Dokumen KP";
                const body = payload?.notification?.body || payload?.data?.body || "";
                const isApproved = payload?.data?.status === "APPROVED";
                if (isApproved) {
                  toast.success(title, { description: body, duration: 5000 });
                } else {
                  toast.error(title, { description: body, duration: 8000 });
                }
                qc.invalidateQueries({ queryKey: ["student-internship-details"] });
                qc.invalidateQueries({ queryKey: ["notification-unread"] });
                break;
              }
              case "internship_final_report_uploaded": {
                if (role === "lecturer" || role === "supervisor") {
                  const title = payload?.notification?.title || payload?.data?.title || "Laporan Akhir Baru";
                  const body = payload?.notification?.body || payload?.data?.body || "Mahasiswa telah mengunggah laporan akhir";
                  toast.info(title, { description: body, duration: 5000 });
                  playBeep();
                  qc.invalidateQueries({ queryKey: ["lecturer-student-guidance-timeline"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                }
                break;
              }
              case "internship_final_report_verification": {
                if (role === "student") {
                  const title = payload?.notification?.title || payload?.data?.title || "Verifikasi Laporan Akhir";
                  const body = payload?.notification?.body || payload?.data?.body || "";
                  const isApproved = payload?.data?.status === "APPROVED";
                  if (isApproved) {
                    toast.success(title, { description: body, duration: 5000 });
                  } else {
                    toast.error(title, { description: body, duration: 8000 });
                  }
                  qc.invalidateQueries({ queryKey: ["student-logbooks"] });
                  qc.invalidateQueries({ queryKey: ["student-guidance"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                }
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
                  break;
                }
                case 'thesis-guidance:rescheduled':
                case 'thesis-guidance:cancelled':
                case 'thesis-guidance:approved':
                case 'thesis-guidance:rejected':
                case 'thesis-guidance:notes-updated': {
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['lecturer-requests'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'internship_guidance:submitted': {
                  qc.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case 'internship_guidance:approved': {
                  qc.invalidateQueries({ queryKey: ['student-guidance'] });
                  qc.invalidateQueries({ queryKey: ['notification-unread'] });
                  break;
                }
                case "internship_reporting_document_uploaded": {
                  qc.invalidateQueries({ queryKey: ["sekdep-internships"] });
                  qc.invalidateQueries({ queryKey: ["internship-detail"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_document_verification": {
                  qc.invalidateQueries({ queryKey: ["student-internship-details"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_final_report_uploaded": {
                  qc.invalidateQueries({ queryKey: ["lecturer-student-guidance-timeline"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_final_report_verification": {
                  qc.invalidateQueries({ queryKey: ["student-logbooks"] });
                  qc.invalidateQueries({ queryKey: ["student-guidance"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "supervisor2_request":
                case "supervisor2_approved":
                case "supervisor2_rejected":
                case "role_promotion": {
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_invitation":
                case "internship_invitation_response":
                case "internship_proposal_response":
                case "internship_proposal_accepted":
                case "internship_proposal_partially_accepted":
                case "internship_proposal_rejected_company":
                case "internship_company_response_rejected_sekdep": {
                  qc.invalidateQueries({ queryKey: ["student-internship-proposals"] });
                  qc.invalidateQueries({ queryKey: ["internship-proposal-detail"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_new_proposal":
                case "internship_company_response": {
                  qc.invalidateQueries({ queryKey: ["sekdep-internship-proposals"] });
                  qc.invalidateQueries({ queryKey: ["admin-internship-proposals"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_seminar_scheduled": {
                  qc.invalidateQueries({ queryKey: ["lecturer-seminar-requests"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_seminar_reminder": {
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
                  break;
                }
                case "internship_grading_completed": {
                  qc.invalidateQueries({ queryKey: ["student-internship-details"] });
                  qc.invalidateQueries({ queryKey: ["notification-unread"] });
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
