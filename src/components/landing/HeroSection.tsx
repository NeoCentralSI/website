import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-end overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        {/* Global dark overlay — subtle */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Gradient overlay only where text sits (lower-left quadrant) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 35%, transparent 60%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8 lg:pb-36">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-display font-extrabold leading-[0.95] tracking-tight text-white"
            style={{
              fontSize: 'clamp(3.5rem, 9vw, 7.5rem)',
              textShadow: '0 2px 24px rgba(0,0,0,0.35)',
            }}
          >
            NEO
            <br />
            <span className="text-[#F5A623]">CENTRAL</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.12 }}
            className="mt-5 max-w-xl font-body text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
          >
            Platform Digital untuk Kerja Praktek &amp; Tugas Akhir Departemen Sistem Informasi Universitas Andalas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#F5A623] px-6 py-3.5 font-body text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-[#e0951a] hover:shadow-black/30"
            >
              Mulai Sekarang
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 font-body text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
            >
              Pelajari Lebih Lanjut
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
