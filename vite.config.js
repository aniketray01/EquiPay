import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    define: {
      'process.env': { ...env, NODE_ENV: mode }
    },
    plugins: [react()],
    base: '/',
    server: {
      port: 3000,
      open: true,
    },
    preview: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            vendor: ['lucide-react', 'recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    }
  }
})