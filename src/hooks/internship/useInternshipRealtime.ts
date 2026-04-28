import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type InternshipPushEventType =
  | "internship_invitation"
  | "internship_invitation_response"
  | "internship_new_proposal"
  | "internship_proposal_response"
  | "internship_proposal_approved_admin"
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
  | "internship_document_bulk_verification"
  | "internship_final_report_uploaded"
  | "internship_final_report_verification"
  | "internship_final_report_rejected"
  | "internship_field_assessment_completed"
  | "internship_seminar_scheduled"
  | "internship_seminar_response"
  | "internship_seminar_completed"
  | "internship_seminar_reminder"
  | "internship_seminar_audience_validated"
  | "internship_grading_completed"
  | "internship_completed"
  | "internship_status_failed"
  | "internship_lecturer_assignment_generated"
  | "internship_supervisor_letter_signed";

export function useInternshipRealtimeHandlers() {
  const qc = useQueryClient();

  const handleInternshipMessage = (payload: any, playBeep: () => void) => {
    const type = payload?.data?.type as InternshipPushEventType;
    const role = payload?.data?.role;
    const title = payload?.notification?.title || payload?.data?.title || "Notifikasi Kerja Praktik";
    const body = payload?.notification?.body || payload?.data?.body || "";

    switch (type) {
      case "internship_invitation":
      case "internship_invitation_response":
      case "internship_proposal_response":
      case "internship_proposal_accepted":
      case "internship_proposal_partially_accepted":
      case "internship_proposal_rejected_company":
      case "internship_company_response_rejected_sekdep": {
        if (type === 'internship_company_response_rejected_sekdep') {
          toast.error(title, { description: body, duration: 8000 });
        } else {
          toast(title, { description: body, duration: 5000 });
        }
        qc.invalidateQueries({ queryKey: ["student-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["internship-proposal-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_new_proposal":
      case "internship_company_response":
      case "internship_proposal_approved_admin": {
        toast(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["sekdep-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["admin-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_seminar_scheduled": {
        if (role === "lecturer" || role === "supervisor") {
          const t = payload?.notification?.title || "Seminar KP Baru";
          const b = payload?.notification?.body || "Mahasiswa telah menjadwalkan seminar KP";
          toast.info(t, { description: b, duration: 8000 });
          playBeep();
          qc.invalidateQueries({ queryKey: ["lecturer-seminar-requests"] });
        }
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_seminar_response": {
        const isApproved = payload?.data?.status === "APPROVED";
        if (isApproved) {
          toast.success(title, { description: body, duration: 8000 });
        } else {
          toast.error(title, { description: body, duration: 8000 });
        }
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_seminar_completed": {
        toast.success(title, { description: body, duration: 8000 });
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_seminar_audience_validated": {
        toast.success(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["seminar-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_seminar_reminder": {
        const t = payload?.notification?.title || "Pengingat Seminar KP";
        const b = payload?.notification?.body || "Seminar KP akan dimulai dalam 10 menit";
        toast.warning(t, { description: b, duration: 10000 });
        playBeep();
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_grading_completed":
      case "internship_completed": {
        if (role === "student" || !role) {
          toast.success(title, { description: body, duration: 8000 });
          qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        }
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_status_failed": {
        toast.error(title, { description: body, duration: 0 }); // Sticky
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_supervisor_assigned": {
        toast.success(title, { description: body, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["sekdep-lecturer-workload"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_guidance:submitted": {
        const t = payload?.notification?.title || "Bimbingan Baru";
        const b = payload?.notification?.body || "Mahasiswa telah mengunggah bimbingan";
        toast.info(t, { description: b, duration: 5000 });
        playBeep();
        qc.invalidateQueries({ queryKey: ["lecturer-student-guidance-timeline"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_lecturer_assignment_generated": {
        toast.info(title, { description: body, duration: 8000 });
        playBeep();
        qc.invalidateQueries({ queryKey: ["kadep-pending-letters"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_supervisor_letter_signed": {
        toast.success(title, { description: body, duration: 8000 });
        playBeep();
        qc.invalidateQueries({ queryKey: ["lecturerSupervisedStudents"] });
        qc.invalidateQueries({ queryKey: ["lecturerSupervisorLetter"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_guidance:approved": {
        const t = payload?.notification?.title || "Bimbingan Dievaluasi";
        const b = payload?.notification?.body || "Bimbingan Anda telah dievaluasi oleh pembimbing";
        toast.success(t, { description: b, duration: 5000 });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_reporting_document_uploaded": {
        toast.info(title, { description: body, duration: 5000 });
        playBeep();
        qc.invalidateQueries({ queryKey: ["sekdep-internships"] });
        qc.invalidateQueries({ queryKey: ["internship-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_document_verification":
      case "internship_document_bulk_verification": {
        const isApproved = payload?.data?.status === "APPROVED";
        if (isApproved) {
          toast.success(title, { description: body, duration: 5000 });
        } else {
          toast.error(title, { description: body, duration: 8000 });
        }
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_final_report_uploaded": {
        if (role === "lecturer" || role === "supervisor") {
          toast.info(title, { description: body, duration: 5000 });
          playBeep();
          qc.invalidateQueries({ queryKey: ["lecturer-student-guidance-timeline"] });
          qc.invalidateQueries({ queryKey: ["notification-unread"] });
        }
        return true;
      }

      case "internship_final_report_verification": {
        if (role === "student") {
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
        return true;
      }

      case "internship_final_report_rejected": {
        toast.error(title, { description: body, duration: 8000 });
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      case "internship_field_assessment_completed": {
        toast.success(title, { description: body, duration: 8000 });
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      }

      default:
        return false;
    }
  };

  const handleInternshipBackgroundMessage = (msg: any) => {
    const type = msg?.data?.type as InternshipPushEventType;

    switch (type) {
      case 'internship_guidance:submitted':
      case 'internship_final_report_uploaded':
        qc.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline'] });
        qc.invalidateQueries({ queryKey: ['notification-unread'] });
        return true;
      case 'internship_guidance:approved':
        qc.invalidateQueries({ queryKey: ['student-guidance'] });
        qc.invalidateQueries({ queryKey: ['notification-unread'] });
        return true;
      case "internship_reporting_document_uploaded":
        qc.invalidateQueries({ queryKey: ["sekdep-internships"] });
        qc.invalidateQueries({ queryKey: ["internship-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_document_verification":
      case "internship_document_bulk_verification":
      case "internship_final_report_verification":
      case "internship_final_report_rejected":
      case "internship_field_assessment_completed":
      case "internship_seminar_response":
      case "internship_seminar_completed":
      case "internship_grading_completed":
      case "internship_completed":
      case "internship_status_failed":
        qc.invalidateQueries({ queryKey: ["student-internship-details"] });
        qc.invalidateQueries({ queryKey: ["student-logbooks"] });
        qc.invalidateQueries({ queryKey: ["student-guidance"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_invitation":
      case "internship_invitation_response":
      case "internship_proposal_response":
      case "internship_proposal_accepted":
      case "internship_proposal_partially_accepted":
      case "internship_proposal_rejected_company":
      case "internship_company_response_rejected_sekdep":
        qc.invalidateQueries({ queryKey: ["student-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["internship-proposal-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_new_proposal":
      case "internship_company_response":
      case "internship_proposal_approved_admin":
        qc.invalidateQueries({ queryKey: ["sekdep-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["admin-internship-proposals"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_seminar_scheduled":
        qc.invalidateQueries({ queryKey: ["lecturer-seminar-requests"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_seminar_audience_validated":
        qc.invalidateQueries({ queryKey: ["seminar-detail"] });
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      case "internship_seminar_reminder":
        qc.invalidateQueries({ queryKey: ["notification-unread"] });
        return true;
      default:
        return false;
    }
  };

  return { handleInternshipMessage, handleInternshipBackgroundMessage };
}
