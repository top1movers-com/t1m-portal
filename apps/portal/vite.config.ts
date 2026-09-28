import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // <use href="sprite.svg#id"> cannot reference a data: URI, so the icon sprite must stay a file.
    assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined),
  },
})
