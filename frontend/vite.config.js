import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces (fixes IPv6/IPv4 issue)
    port: 5173,
    strictPort: true, // Don't try other ports
    watch: {
      // Exclude unnecessary files from watching
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.log',
        '**/uploads/**'
      ]
    },
    // Optimize HMR
    hmr: {
      overlay: true
    }
  },
  // Optimize build performance
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
