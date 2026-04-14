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
    <div ref={ref}>
      <p className="font-display text-3xl font-bold text-[#F7931E]">
        {count}
        {suffix}
      </p>
      <p className="mt-1 font-body text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

export function AboutSection() {
  return (
    <section id="about" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <FadeIn>
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                Tentang <span className="text-[#F7931E]">Kami</span>
              </h2>
              <p className="max-w-lg font-body text-base leading-relaxed text-gray-600">
                NeoCentral membantu civitas akademika memonitor proses Kerja Praktek dan Tugas Akhir secara
                terstruktur, transparan, dan mudah ditindaklanjuti oleh mahasiswa, dosen, serta pengelola.
              </p>
              <StaggerContainer className="flex flex-wrap gap-8 pt-2">
                <StaggerItem>
                  <CountUpStat value={500} suffix="+" label="Mahasiswa aktif" />
                </StaggerItem>
                <StaggerItem>
                  <CountUpStat value={98} suffix="%" label="Tingkat kepuasan" />
                </StaggerItem>
              </StaggerContainer>
            </div>
          </FadeIn>

          <FadeIn>
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
              alt="Mahasiswa belajar bersama di lingkungan kampus"
              className="aspect-[4/3] w-full rounded-xl object-cover shadow-lg"
              loading="lazy"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
