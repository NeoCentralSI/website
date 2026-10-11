import { StudentReadinessStatusCard, type StudentReadinessStatusCardProps } from "./StudentReadinessStatusCard";

/** Student card: seminar readiness. */
export function SeminarReadinessStatusCard(props: StudentReadinessStatusCardProps) {
  return <StudentReadinessStatusCard kind="seminar" {...props} />;
}
