import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ThesisActionBlockedAlertProps {
  /** Alasan dari `getGuidanceActionBlockReason`; tidak merender apa pun bila null. */
  reason: string | null;
  className?: string;
}

/** Alasan terlihat untuk aksi bimbingan/milestone yang dinonaktifkan (K14). */
export function ThesisActionBlockedAlert({ reason, className }: ThesisActionBlockedAlertProps) {
  if (!reason) return null;
  return (
    <Alert className={className}>
      <Info className="h-4 w-4" />
      <AlertTitle>Aksi tidak tersedia</AlertTitle>
      <AlertDescription>{reason}</AlertDescription>
    </Alert>
  );
}
