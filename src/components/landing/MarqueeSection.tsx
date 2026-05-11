import { motion } from 'motion/react';

export function MarqueeSection() {
  const marqueeText = [
    'Pelacakan Revisi',
    'Dashboard Akademik',
    'Kerja Praktek',
    'Penjadwalan Bimbingan',
    'Reminder Deadline',
    'Monitoring Progress',
    'Seminar dan Sidang',
    'Dokumen SOP',
  ];

  const marqueeItems = marqueeText.flatMap((text) => [text, '·']);

  return (
    <section className="border-t border-gray-200/60 bg-gray-100/80 py-3">
      <div className="mx-auto flex max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={{ x: ['0%', '-100%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 50,
              ease: 'linear',
            },
          }}
          className="flex shrink-0 items-center gap-8"
        >
          {marqueeItems.map((item, index) => (
            <span
              key={index}
              className={`whitespace-nowrap font-body text-xs font-medium tracking-wide sm:text-sm ${
                item === '·'
                  ? 'text-gray-300'
                  : 'text-gray-500'
              }`}
            >
              {item}
            </span>
          ))}
        </motion.div>

        <motion.div
          animate={{ x: ['0%', '-100%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 50,
              ease: 'linear',
            },
          }}
          className="flex shrink-0 items-center gap-8"
          aria-hidden="true"
        >
          {marqueeItems.map((item, index) => (
            <span
              key={index}
              className={`whitespace-nowrap font-body text-xs font-medium tracking-wide sm:text-sm ${
                item === '·'
                  ? 'text-gray-300'
                  : 'text-gray-500'
              }`}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
