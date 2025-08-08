import { defineConfig, loadEnv } from 'vite'
import { VitePluginNode } from 'vite-plugin-node'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      port: Number(env.PORT) || 3000
    },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'app',
      tsCompiler: 'esbuild'
    })
  ],
  optimizeDeps: {
    exclude: ['fsevents']
  }
  }
})
