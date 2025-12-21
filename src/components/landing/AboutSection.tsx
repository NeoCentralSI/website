import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function AboutSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section id="about" ref={containerRef} className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div>
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-black mb-8 leading-none">
                TENTANG<br/>
                <span className="text-[#F7931E]">KAMI</span>
              </h2>
              <div className="w-32 h-2 bg-[#F7931E] rounded-full mb-8"></div>
            </div>
            
            <p className="text-2xl text-black leading-relaxed font-bold">
              Platform SuperApp untuk Departemen Sistem Informasi Universitas Andalas
            </p>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Mengintegrasikan semua kebutuhan administratif akademik dalam satu ekosistem digital yang modern dan efisien.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-8">
              <div>
                <div className="text-6xl font-black text-[#F7931E] mb-2">500+</div>
                <div className="text-lg font-bold text-black uppercase">Mahasiswa</div>
              </div>
              <div>
                <div className="text-6xl font-black text-[#F7931E] mb-2">98%</div>
                <div className="text-lg font-bold text-black uppercase">Kepuasan</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <img 
              src="https://images.unsplash.com/photo-1751551525897-d34215e47785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMHdvcmtzcGFjZSUyMGNvbXB1dGVyfGVufDF8fHx8MTc2NjMyMDk2N3ww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Programming Workspace"
              className="w-full h-auto rounded-3xl"
            />
            
            {/* Decorative Orange Block */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#F7931E] rounded-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
