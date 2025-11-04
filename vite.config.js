import { defineConfig } from 'vite'

export default defineConfig({
  base: '/polarity-bullet-hell/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
