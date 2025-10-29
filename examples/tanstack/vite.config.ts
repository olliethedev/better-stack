// vite.config.ts
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'


const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    isProduction && nitro(
      { config: { preset: 'node-server' } }
    ),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})