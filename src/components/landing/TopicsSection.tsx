import { motion } from 'motion/react';
import { FadeIn } from './FadeIn';

const topics = [
  {
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    title: 'Sistem Pendukung Keputusan (SPK)',
    category: 'Data Science',
    featured: true,
  },
  {
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    title: 'Business Intelligence (BI)',
    category: 'Enterprise',
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80',
    title: 'Pengembangan Sistem (Enterprise Application)',
    category: 'Web Development',
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&q=80',
    title: 'Machine Learning',
    category: 'AI',
    featured: false,
  },
  {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    title: 'Enterprise System',
    category: 'Infrastructure',
    featured: false,
  },
];

function TopicCard({ topic, index }: { topic: (typeof topics)[0]; index: number }) {
  if (topic.featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: index * 0.08 }}
        className="group relative col-span-2 row-span-2 overflow-hidden rounded-sm"
        style={{ minHeight: '420px' }}
      >
        <img
          src={topic.url}
          alt={topic.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Bottom gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <span className="inline-block rounded-full bg-[#F5A623]/90 px-3 py-1 font-body text-xs font-semibold uppercase tracking-wide text-white">
            {topic.category}
          </span>
          <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
            {topic.title}
          </h3>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-sm"
      style={{ minHeight: '200px' }}
    >
      <img
        src={topic.url}
        alt={topic.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />
      {/* Bottom gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <span className="inline-block rounded-full bg-[#F5A623]/85 px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-white">
          {topic.category}
        </span>
        <h3 className="mt-2 font-display text-base font-bold leading-snug text-white sm:text-lg">
          {topic.title}
        </h3>
      </div>
    </motion.div>
  );
}

export function TopicsSection() {
  return (
    <section id="topics" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-10 sm:mb-14">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Topik <span className="text-[#F5A623]">Tugas Akhir</span>
          </h2>
          <p className="mt-3 max-w-2xl font-body text-base leading-relaxed text-gray-500 sm:text-lg">
            Bidang penelitian dan pengembangan di Departemen Sistem Informasi
          </p>
        </FadeIn>

        {/* Editorial grid: featured card spans 2 cols + 2 rows, others fill remaining */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic, index) => (
            <TopicCard key={topic.title} topic={topic} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
