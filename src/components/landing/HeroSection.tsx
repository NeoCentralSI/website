import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="space-y-6 lg:space-y-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="font-display font-extrabold leading-[1.05] tracking-tight text-gray-900"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
            >
              NEO
              <br />
              <span className="text-[#F7931E]">CENTRAL</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="max-w-md font-body text-base leading-relaxed text-gray-600 sm:text-lg"
            >
              Platform Digital untuk Kerja Praktek &amp; Tugas Akhir Departemen Sistem Informasi Universitas Andalas.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-[#F7931E] px-5 py-3 font-body text-sm font-medium text-white transition-colors duration-200 hover:bg-[#E08319]"
              >
                Mulai Sekarang
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-lg border border-[#F7931E] px-5 py-3 font-body text-sm font-medium text-[#F7931E] transition-colors duration-200 hover:bg-[#FFF8F0]"
              >
                Pelajari Lebih Lanjut
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
              alt="Mahasiswa berdiskusi menggunakan laptop di kampus"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
