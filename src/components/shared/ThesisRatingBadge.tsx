import { Badge } from '@/components/ui/badge';
import { getThesisRatingLabel, getThesisRatingVariant } from '@/lib/thesisLabels';

interface ThesisRatingBadgeProps {
  rating: string | null | undefined;
  className?: string;
}

/** Badge rating progres TA (`ThesisRating`), label dari `lib/thesisLabels`. */
export function ThesisRatingBadge({ rating, className }: ThesisRatingBadgeProps) {
  return (
    <Badge variant={getThesisRatingVariant(rating)} className={className}>
      {getThesisRatingLabel(rating)}
    </Badge>
  );
}
