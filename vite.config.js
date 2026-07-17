import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fully client-side. No proxy, no backend. Works in airplane mode.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose on LAN so you can open it on a real phone
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
