import { useState } from 'react';

export const useGuidanceDialogs = () => {
  const [openRequest, setOpenRequest] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);

  const openDocumentPreview = (fileName?: string | null, filePath?: string | null) => {
    setDocInfo({ fileName, filePath });
    setDocOpen(true);
  };

  return {
    openRequest,
    setOpenRequest,
    docOpen,
    setDocOpen,
    docInfo,
    openDocumentPreview,
  };
};
