/**
 * Accudoc - Accurate Documentation
 *
 * Rust-style doctests for JavaScript/TypeScript markdown documentation.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'accudoc';
 *
 * export default defineConfig({
 *   docs: './docs',
 *   imports: {
 *     '@mylib/core': './dist/index.js',
 *   },
 * });
 * ```
 */

// Configuration
export { defineConfig, loadConfig } from './config.js';

// Runner
export { runDoctests, processFile, runDoctest, findMarkdownFiles } from './runner.js';

// Extractor
export { extractDoctests, stripHiddenLines } from './extractor.js';

// Transformer
export { transformCode } from './transformer.js';

// Environment
export { createDomEnvironment, applyEnvironment } from './environment.js';

// Types
export type {
  AccudocConfig,
  TestEnvironment,
  Doctest,
  DoctestResult,
  FileResult,
  RunSummary,
} from './types.js';
