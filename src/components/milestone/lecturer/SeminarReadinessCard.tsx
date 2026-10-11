import { LecturerReadinessCard, type LecturerReadinessCardProps } from "./LecturerReadinessCard";

/** Supervisor card: seminar readiness (>= 8 completed sessions, milestones 100%). */
export function SeminarReadinessCard(props: LecturerReadinessCardProps) {
  return <LecturerReadinessCard kind="seminar" {...props} />;
}
