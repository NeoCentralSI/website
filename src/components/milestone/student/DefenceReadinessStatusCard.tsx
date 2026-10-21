import { StudentReadinessStatusCard, type StudentReadinessStatusCardProps } from "./StudentReadinessStatusCard";

/** Student card: defence readiness. */
export function DefenceReadinessStatusCard(props: StudentReadinessStatusCardProps) {
  return <StudentReadinessStatusCard kind="defence" {...props} />;
}
