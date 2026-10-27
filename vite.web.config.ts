// Aperçu navigateur (sans Electron) : utile pour travailler le design.
// Le pont `window.mira` est alors remplacé par une version simulée.
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src/renderer',
  resolve: { alias: { '@': resolve('src/renderer/src'), '@shared': resolve('src/shared') } },
  plugins: [react()],
  server: { port: 5173, host: true }
})
