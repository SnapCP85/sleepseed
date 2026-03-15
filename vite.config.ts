import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Injects NARRATOR_VOICE_ID from env at build time
    __NARRATOR_VOICE_ID__: JSON.stringify(process.env.VITE_NARRATOR_VOICE_ID || ""),
  },
})
