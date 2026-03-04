import LecturerSeminarDetailIdentity from './LecturerSeminarDetailIdentity';

/**
 * Default lecturer seminar detail page.
 * Shows the identity/read-only view when the seminar is not ongoing
 * or the lecturer doesn't have examiner/supervisor actions.
 */
export default function LecturerSeminarDetailPage() {
  return <LecturerSeminarDetailIdentity />;
}
