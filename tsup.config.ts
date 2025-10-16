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
  noExternal: ['pptxgenjs', 'uuid']
})
