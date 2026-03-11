import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-table'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-avatar',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-navigation-menu',
          ],
          'vendor-charts': ['recharts'],
          'vendor-calendar': [
            '@fullcalendar/core',
            '@fullcalendar/daygrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list',
            '@fullcalendar/react',
            '@fullcalendar/timegrid',
          ],
          'vendor-pdf-viewer': ['pdfjs-dist', 'react-pdf'],
          'vendor-pdf-gen': ['jspdf', 'jspdf-autotable'],
          'vendor-firebase': ['firebase/app', 'firebase/messaging'],
          'vendor-editor': ['react-quill-new'],
          'vendor-animation': ['lottie-react', 'motion'],
          'vendor-misc': ['date-fns', 'zod', 'zustand', 'sonner'],
        },
      },
      onwarn(warning, defaultHandler) {
        // Suppress eval warning from lottie-web (third-party, cannot fix)
        if (warning.code === 'EVAL' && warning.id?.includes('lottie-web')) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
})
