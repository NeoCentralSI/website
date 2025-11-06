import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GuidanceHistoryPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  useEffect(() => {
    const q = sp.get('q');
    const supervisor = sp.get('supervisor');
    const sort = sp.get('sort');
    const page = sp.get('page');
    const limit = sp.get('limit');
    const params = new URLSearchParams();
    params.set('status', 'accepted');
    if (q) params.set('q', q);
    if (supervisor) params.set('supervisor', supervisor);
    if (sort) params.set('sort', sort);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    navigate(`/tugas-akhir/bimbingan/student?${params.toString()}`, { replace: true });
  }, [navigate, sp]);
  return null;
}
