import { useState } from 'react';

export const useLecturerGuidanceDialogs = () => {
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);

  const openDocumentPreview = (fileName?: string | null, filePath?: string | null) => {
    setDocInfo({ fileName, filePath });
    setDocOpen(true);
  };

  return {
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  };
};
