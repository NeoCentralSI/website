import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, FileText } from 'lucide-react';
import * as sopService from '@/services/sop.service';
import type { SopFile, SopType } from '@/types/sop.types';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

type SopMeta = {
  key: SopType;
  title: string;
  description: string;
};

const sopDocuments: SopMeta[] = [
  {
    key: 'kerja-praktik',
    title: 'Panduan Kerja Praktek',
    description:
      'Panduan lengkap prosedur untuk Kerja Praktek mahasiswa Departemen Sistem Informasi',
  },
  {
    key: 'tugas-akhir',
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
  const containerRef = useRef(null);
  const [data, setData] = useState<SopFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Partial<Record<SopType, { thumb?: string; pages?: number }>>>({});

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

  const generatePreview = useCallback(async (file: SopFile) => {
    try {
      const loadingTask = getDocument(file.url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      // target width ~600px for landing visual
      const scale = 600 / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise;
      const thumb = canvas.toDataURL('image/png');
      setPreviews((prev) => ({
        ...prev,
        [file.type]: { thumb, pages: pdf.numPages },
      }));
    } catch (err) {
      console.error('Failed generating SOP preview', err);
    }
  }, []);

  useEffect(() => {
    data.forEach((file) => {
      const existing = previews[file.type];
      if (!existing?.thumb) {
        generatePreview(file);
      }
    });
  }, [data, generatePreview, previews]);

  return (
    <section id="sop" ref={containerRef} className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-black mb-4 leading-none">
            PANDUAN
          </h2>
          <div className="space-y-2">
            <p className="text-2xl text-gray-600 max-w-2xl font-semibold">
              Unduh dokumen panduan untuk Kerja Praktek dan Tugas Akhir.
            </p>
            <p className="text-base text-gray-500 max-w-2xl">
              Catatan: Standar operasional yang lebih lengkap tersedia di Teams Departemen.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
            {sopDocuments.map((doc, index) => {
              const sopFile = sopMap.get(doc.key);
              const preview = previews[doc.key];
            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              {/* PDF Preview */}
                <div
                  className="bg-gray-100 aspect-3/4 mb-6 flex items-center justify-center relative overflow-hidden rounded-2xl cursor-pointer"
                  onClick={() => openPdf(sopFile?.url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPdf(sopFile?.url);
                    }
                  }}
                >
                  {preview?.thumb ? (
                    <img
                      src={preview.thumb}
                      alt={doc.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-100"></div>
                      <FileText className="w-32 h-32 text-gray-400 relative z-10" strokeWidth={1.5} />
                    </>
                  )}
                  <div className="absolute inset-0 bg-[#F7931E] opacity-0 group-hover:opacity-90 transition-opacity flex items-center justify-center rounded-2xl">
                    <div className="text-white text-center">
                      <FileText className="w-20 h-20 mx-auto mb-4" strokeWidth={2} />
                      <p className="text-xl font-bold">PREVIEW PDF</p>
                    </div>
                  </div>
                </div>

              {/* Document Info */}
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-black">
                  {doc.title}
                </h3>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  {doc.description}
                </p>

                <div className="flex items-center gap-6 text-sm font-bold text-gray-500">
                  <span>{sopFile ? formatSize(sopFile.size) : '—'}</span>
                  <span>-</span>
                  <span>{preview?.pages ? `${preview.pages} halaman` : '—'}</span>
                  <span>-</span>
                  <span>PDF</span>
                </div>

                <button
                  disabled={!sopFile || loading}
                  className="bg-[#F7931E] text-white px-8 py-4 rounded-2xl hover:bg-[#E08319] transition-all flex items-center gap-3 group font-bold text-lg w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => downloadPdf(sopFile?.url, sopFile?.fileName)}
                >
                  {loading && <span className="text-sm">Memuat...</span>}
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  UNDUH PANDUAN
                </button>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
              </div>

              {/* Decorative Line */}
              <motion.div 
                className="absolute -bottom-6 left-0 h-1 bg-[#F7931E] rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: '40%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
              />
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Large Text Background */}
      <div className="absolute bottom-20 right-0 text-[15rem] font-black text-gray-50 leading-none pointer-events-none whitespace-nowrap">
        SOP
      </div>
    </section>
  );
}
