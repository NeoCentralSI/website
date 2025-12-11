import { useState } from 'react';
import type { GuidanceItem } from '@/services/lecturerGuidance.service';

export const useLecturerGuidanceDialogs = () => {
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceItem | null>(null);

  const openDetail = (guidance: GuidanceItem) => {
    setSelectedGuidance(guidance);
    setDetailOpen(true);
  };

  const openDocumentPreview = (fileName?: string | null, filePath?: string | null) => {
    setDocInfo({ fileName, filePath });
    setDocOpen(true);
  };

  return {
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
    detailOpen,
    setDetailOpen,
    selectedGuidance,
    openDetail,
  };
};
