import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { FadeIn, StaggerContainer, StaggerItem } from './FadeIn';

interface CountUpStatProps {
  value: number;
  suffix?: string;
  label: string;
}

function CountUpStat({ value, suffix = '', label }: CountUpStatProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let frameId = 0;
    const duration = 900;
    const startTime = performance.now();

    const update = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.round(value * progress));
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [inView, value]);

  return (
    <div ref={ref} className="space-y-1">
      <p className="font-display font-extrabold leading-none tracking-tight text-gray-900" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
        {count}
        {suffix}
      </p>
      <p className="font-body text-sm font-medium uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="relative bg-white">
      <div className="grid min-h-[80vh] items-stretch lg:grid-cols-[0.4fr_0.6fr]">
        {/* Text content — 40% */}
        <div className="flex items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 xl:px-20">
          <FadeIn>
            <div className="space-y-8">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                Tentang <span className="text-[#F5A623]">Kami</span>
              </h2>
              <p className="max-w-lg font-body text-base leading-relaxed text-gray-600 sm:text-lg sm:leading-relaxed">
                NeoCentral membantu civitas akademika memonitor proses Kerja Praktek dan Tugas Akhir secara
                terstruktur, transparan, dan mudah ditindaklanjuti oleh mahasiswa, dosen, serta pengelola.
              </p>
              <StaggerContainer className="flex flex-wrap gap-10 pt-4">
                <StaggerItem>
                  <CountUpStat value={500} suffix="+" label="Mahasiswa aktif" />
                </StaggerItem>
                <StaggerItem>
                  <CountUpStat value={98} suffix="%" label="Tingkat kepuasan" />
                </StaggerItem>
              </StaggerContainer>
            </div>
          </FadeIn>
        </div>

        {/* Full-bleed image — 60%, no border-radius, no padding */}
        <div className="relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=80"
            alt="Mahasiswa belajar bersama di lingkungan kampus"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
