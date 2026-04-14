import { motion } from 'motion/react';

export function MarqueeSection() {
  const marqueeText = [
    'Kerja Praktek',
    'Penjadwalan Bimbingan',
    'Reminder Deadline',
    'Monitoring Progress',
    'Seminar dan Sidang',
    'Dokumen SOP',
    'Pelacakan Revisi',
    'Dashboard Akademik',
  ];

  const marqueeItems = marqueeText.flatMap((text) => [text, '·']);

  return (
    <section className="border-y border-[#FCE1C4] bg-[#FFF8F0] py-4">
      <div className="mx-auto flex max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={{
            x: ['0%', '-100%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 45,
              ease: 'linear',
            },
          }}
          className="flex shrink-0 gap-6"
        >
          {marqueeItems.map((item, index) => (
            <span
              key={index}
              className={`whitespace-nowrap font-body text-sm font-medium sm:text-base ${
                item === '·' ? 'text-[#E9B06E]' : 'text-[#C26B09]'
              }`}
            >
              {item}
            </span>
          ))}
        </motion.div>

        <motion.div
          animate={{
            x: ['0%', '-100%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 45,
              ease: 'linear',
            },
          }}
          className="flex shrink-0 gap-6"
        >
          {marqueeItems.map((item, index) => (
            <span
              key={index}
              className={`whitespace-nowrap font-body text-sm font-medium sm:text-base ${
                item === '·' ? 'text-[#E9B06E]' : 'text-[#C26B09]'
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
