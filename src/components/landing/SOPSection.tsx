import { useRef } from 'react';
import { motion } from 'motion/react';
import { Download, FileText } from 'lucide-react';

const sopDocuments = [
  {
    title: 'SOP KERJA PRAKTEK',
    description: 'Panduan lengkap prosedur operasional standar untuk Kerja Praktek mahasiswa Departemen Sistem Informasi',
    pages: '12 Halaman',
    size: '2.4 MB',
    color: '#F7931E'
  },
  {
    title: 'SOP TUGAS AKHIR',
    description: 'Panduan lengkap prosedur operasional standar untuk Tugas Akhir mahasiswa Departemen Sistem Informasi',
    pages: '16 Halaman',
    size: '3.1 MB',
    color: '#F7931E'
  }
];

export function SOPSection() {
  const containerRef = useRef(null);

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
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-black mb-8 leading-none">
            STANDAR<br/>
            <span className="text-[#F7931E]">OPERASIONAL</span>
          </h2>
          <p className="text-2xl text-gray-600 max-w-2xl font-semibold">
            Unduh dokumen SOP untuk panduan lengkap
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {sopDocuments.map((doc, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              {/* PDF Preview */}
              <div className="bg-gray-100 aspect-3/4 mb-6 flex items-center justify-center relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-100"></div>
                <FileText className="w-32 h-32 text-gray-400 relative z-10" strokeWidth={1.5} />
                
                {/* Decorative Lines simulating PDF content */}
                <div className="absolute inset-0 p-12 flex flex-col gap-3">
                  <div className="w-full h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-4/5 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-full h-2 bg-gray-300 rounded-full mt-4"></div>
                  <div className="w-3/4 h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-full h-2 bg-gray-300 rounded-full"></div>
                  <div className="w-2/3 h-2 bg-gray-300 rounded-full"></div>
                </div>

                {/* Overlay on Hover */}
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
                  <span>{doc.pages}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>PDF</span>
                </div>

                <button className="bg-[#F7931E] text-white px-8 py-4 rounded-2xl hover:bg-[#E08319] transition-all flex items-center gap-3 group font-bold text-lg w-full justify-center">
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  UNDUH SOP
                </button>
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
          ))}
        </div>
      </div>

      {/* Large Text Background */}
      <div className="absolute bottom-20 right-0 text-[15rem] font-black text-gray-50 leading-none pointer-events-none whitespace-nowrap">
        SOP
      </div>
    </section>
  );
}
