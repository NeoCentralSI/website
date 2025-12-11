import { useState } from 'react';

export const useGuidanceDialogs = () => {
  const [openRequest, setOpenRequest] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [docInfo, setDocInfo] = useState<{ fileName?: string | null; filePath?: string | null } | null>(null);

  const openDetailDialog = (id: string) => {
    setActiveId(id);
    setOpenDetail(true);
  };

  const openDocumentPreview = (fileName?: string | null, filePath?: string | null) => {
    setDocInfo({ fileName, filePath });
    setDocOpen(true);
  };

  return {
    openRequest,
    setOpenRequest,
    openDetail,
    setOpenDetail,
    activeId,
    docOpen,
    setDocOpen,
    docInfo,
    openDetailDialog,
    openDocumentPreview,
  };
};
