/**
 * VitePress integration for Accudoc
 *
 * Provides utilities for stripping doctest-hidden lines from rendered documentation.
 */

import { stripHiddenLines } from './extractor.js';

/**
 * VitePress markdown code transformer that strips doctest-hidden lines
 *
 * @example
 * ```ts
 * // docs/.vitepress/config.ts
 * import { accudocTransformer } from 'accudoc/vitepress';
 *
 * export default defineConfig({
 *   markdown: {
 *     codeTransformers: [accudocTransformer],
 *   },
 * });
 * ```
 */
export const accudocTransformer = {
  preprocess(code: string): string {
    return stripHiddenLines(code);
  },
};

/**
 * Strip doctest-hidden lines from code
 * Re-exported for convenience
 */
export { stripHiddenLines };
