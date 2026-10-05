import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { dts } from 'rollup-dts-bundler';

const banner = `
/**
 * KeyframeKit
 * @license MIT
 */
`.trim();

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true,
        banner,
        generatedCode: 'es2015'
      },
      {
        file: 'dist/index.min.js',
        format: 'esm',
        sourcemap: true,
        banner,
        generatedCode: 'es2015',
        plugins: [terser({
          compress: { passes: 2 }
        })]
      }
    ],
    plugins: [typescript()]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
      banner
    },
    plugins: [dts()]
  }
]);
