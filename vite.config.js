import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Service worker (vite-plugin-pwa) removed: it repeatedly caused deployed
// fixes to be invisible in already-open tabs, including one case where it
// discarded a save that hadn't reached the server before a stale reload
// overwrote local state. Hashed asset filenames already guarantee a plain
// browser refresh always fetches the latest deploy, so a SW added caching
// risk here without real benefit for this app.
export default defineConfig({
  plugins: [
    react(),
  ],
})
