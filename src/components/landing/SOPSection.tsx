import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import * as sopService from '@/services/sop.service';
import type { SopFile, SopType } from '@/types/sop.types';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FadeIn, StaggerContainer, StaggerItem } from './FadeIn';

type SopMeta = {
  key: SopType;
  title: string;
  description: string;
};

const sopDocuments: SopMeta[] = [
  {
    key: 'SOP_KP',
    title: 'Panduan Kerja Praktik',
    description:
      'Panduan lengkap prosedur untuk Kerja Praktik mahasiswa Departemen Sistem Informasi',
  },
  {
    key: 'SOP_TA',
    title: 'Panduan Tugas Akhir',
    description:
      'Panduan lengkap prosedur untuk Tugas Akhir mahasiswa Departemen Sistem Informasi',
  },
];

function formatSize(size?: number) {
  if (!size) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(1)} ${units[idx]}`;
}

export function SOPSection() {
  const [data, setData] = useState<SopFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<Partial<Record<SopType, number>>>({});

  useEffect(() => {
    GlobalWorkerOptions.workerSrc = pdfWorker;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await sopService.getSopFilesPublic();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch SOP files', err);
        if (mounted) setError('Gagal memuat SOP');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const sopMap = useMemo(() => {
    const map = new Map<SopType, SopFile>();
    data.forEach((item) => map.set(item.type, item));
    return map;
  }, [data]);

  const openPdf = useCallback((url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const downloadPdf = useCallback((url?: string, name?: string) => {
    if (!url) return;
    const dlUrl = sopService.getSopDownloadUrl(url);
    const link = document.createElement("a");
    link.href = dlUrl;
    if (name) link.download = name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const generatePageInfo = useCallback(async (file: SopFile) => {
    try {
      const loadingTask = getDocument(file.url);
      const pdf = await loadingTask.promise;
      setPageInfo((prev) => ({
        ...prev,
        [file.type]: pdf.numPages,
      }));
    } catch (err) {
      console.error('Failed generating SOP page metadata', err);
    }
  }, []);

  useEffect(() => {
    data.forEach((file) => {
      const existingPages = pageInfo[file.type];
      if (!existingPages) {
        generatePageInfo(file);
      }
    });
  }, [data, generatePageInfo, pageInfo]);

  return (
    <section id="sop" className="bg-[#1a1a1a] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-12 sm:mb-16">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Panduan <span className="text-[#F5A623]">SOP</span>
          </h2>
          <div className="mt-3 space-y-1">
            <p className="max-w-2xl font-body text-base leading-relaxed text-gray-400 sm:text-lg">
              Unduh dokumen panduan untuk Kerja Praktek dan Tugas Akhir.
            </p>
            <p className="max-w-2xl font-body text-sm text-gray-500">
              Catatan: Standar operasional yang lebih lengkap tersedia di Teams Departemen.
            </p>
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((item) => (
              <div key={item} className="animate-pulse rounded-sm border border-gray-700/40 bg-[#222] p-6">
                <div className="mb-4 h-12 w-12 rounded-lg bg-gray-700/60" />
                <div className="mb-3 h-5 w-2/3 rounded bg-gray-700/60" />
                <div className="mb-2 h-4 w-full rounded bg-gray-700/60" />
                <div className="mb-5 h-4 w-5/6 rounded bg-gray-700/60" />
                <div className="h-10 w-full rounded-lg bg-gray-700/60" />
              </div>
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid gap-6 md:grid-cols-2">
            {sopDocuments.map((doc) => {
              const sopFile = sopMap.get(doc.key);
              const pages = pageInfo[doc.key];
              return (
                <StaggerItem key={doc.key}>
                  <div
                    className="group space-y-5 rounded-sm border border-gray-700/40 bg-[#222]/80 px-6 py-6 backdrop-blur-sm transition-all duration-300 hover:border-[#F5A623]/30 hover:bg-[#282828]"
                    style={{
                      boxShadow: '0 0 0 rgba(245,166,35,0)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        '0 0 30px rgba(245,166,35,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        '0 0 0 rgba(245,166,35,0)';
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#F5A623]/10 text-[#F5A623] transition-colors duration-300 group-hover:bg-[#F5A623]/15">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-display text-lg font-semibold text-white">{doc.title}</h3>
                          <p className="mt-1 font-body text-sm leading-relaxed text-gray-400">{doc.description}</p>
                        </div>
                      </div>
                      <span className="rounded-sm bg-gray-800 px-2.5 py-1 font-body text-xs font-medium text-gray-400">
                        PDF
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-body text-xs text-gray-500">
                      <span className="rounded-sm bg-[#2a2a2a] px-2 py-1">{sopFile ? formatSize(sopFile.size) : '—'}</span>
                      <span className="rounded-sm bg-[#2a2a2a] px-2 py-1">
                        {pages ? `${pages} halaman` : 'Halaman tidak tersedia'}
                      </span>
                      <span className="rounded-sm bg-[#2a2a2a] px-2 py-1">{sopFile?.fileName ?? 'File belum tersedia'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPdf(sopFile?.url)}
                      disabled={!sopFile}
                      className="inline-flex items-center gap-2 font-body text-sm font-medium text-[#F5A623] transition-colors duration-200 hover:text-[#e0951a] disabled:cursor-not-allowed disabled:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                      Lihat Preview
                    </button>

                    <button
                      type="button"
                      disabled={!sopFile}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#F5A623] px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#e0951a] disabled:cursor-not-allowed disabled:bg-gray-700"
                      onClick={() => downloadPdf(sopFile?.url, sopFile?.fileName)}
                    >
                      <Download className="h-4 w-4" />
                      Unduh Panduan
                    </button>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {error && <p className="mt-4 font-body text-sm text-red-400">{error}</p>}
      </div>
    </section>
  );
}
