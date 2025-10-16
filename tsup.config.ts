import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  platform: 'browser',
  target: 'esnext',
  treeshake: true,
  noExternal: ['uuid'],
  external: [
    'https',
    'http',
    'fs',
    'path',
    'url',
    'crypto',
    'stream',
    'util',
    'os',
    'child_process',
    'net',
    'tls',
    'zlib',
    'events',
    'buffer',
    'querystring'
  ],
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': '"production"',
      global: 'globalThis'
    }
    options.platform = 'browser'
    options.conditions = ['browser', 'module', 'import']
  }
})
