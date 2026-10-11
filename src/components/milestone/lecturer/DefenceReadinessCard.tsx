import { LecturerReadinessCard, type LecturerReadinessCardProps } from "./LecturerReadinessCard";

/** Supervisor card: defence readiness (results seminar passed, revision finalised). */
export function DefenceReadinessCard(props: LecturerReadinessCardProps) {
  return <LecturerReadinessCard kind="defence" {...props} />;
}
