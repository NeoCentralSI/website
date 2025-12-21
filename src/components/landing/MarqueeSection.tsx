import { motion } from 'motion/react';

export function MarqueeSection() {
  const marqueeText = [
    'KERJA PRAKTEK',
    'PENJADWALAN BIMBINGAN',
    'DEADLINE REMINDER',
    'MONITORING',
    'TRACKING PROGRESS',
    'SEMINAR KERJA PRAKTEK',
    'SEMINAR TUGAS AKHIR',
    'SIDANG TUGAS AKHIR',
    'YUDISIUM'
  ];

  // Create array with text and dots alternating
  const marqueeItems = marqueeText.flatMap(text => [text, '•']);

  return (
    <section className="py-12 bg-[#F7931E] overflow-hidden">
      <div className="flex gap-12">
        {/* First marquee set */}
        <motion.div
          animate={{
            x: ['0%', '-100%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 60,
              ease: "linear",
            },
          }}
          className="flex gap-12 shrink-0"
        >
          {marqueeItems.map((item, index) => (
            <span 
              key={index} 
              className={`text-4xl md:text-5xl font-black whitespace-nowrap ${
                item === '•' ? 'text-white/30' : 'text-white'
              }`}
            >
              {item}
            </span>
          ))}
        </motion.div>

        {/* Second marquee set (duplicate for seamless loop) */}
        <motion.div
          animate={{
            x: ['0%', '-100%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 60,
              ease: "linear",
            },
          }}
          className="flex gap-12 shrink-0"
        >
          {marqueeItems.map((item, index) => (
            <span 
              key={index} 
              className={`text-4xl md:text-5xl font-black whitespace-nowrap ${
                item === '•' ? 'text-white/30' : 'text-white'
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
