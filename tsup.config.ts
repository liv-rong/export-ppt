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
  noExternal: ['pptxgenjs', 'uuid'],
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

    // 强制替换 Node.js 模块为空对象
    options.alias = {
      ...options.alias,
      https: 'data:text/javascript,export default {}',
      http: 'data:text/javascript,export default {}',
      fs: 'data:text/javascript,export default {}',
      path: 'data:text/javascript,export default {}',
      url: 'data:text/javascript,export default {}',
      crypto: 'data:text/javascript,export default {}',
      stream: 'data:text/javascript,export default {}',
      util: 'data:text/javascript,export default {}',
      os: 'data:text/javascript,export default {}',
      child_process: 'data:text/javascript,export default {}',
      net: 'data:text/javascript,export default {}',
      tls: 'data:text/javascript,export default {}',
      zlib: 'data:text/javascript,export default {}',
      events: 'data:text/javascript,export default {}',
      buffer: 'data:text/javascript,export default {}',
      querystring: 'data:text/javascript,export default {}'
    }
  }
})
