/**
 * VitePress integration for Accudoc
 *
 * Provides utilities for stripping doctest-hidden lines and assertions from rendered documentation.
 */

import { stripHiddenLines, stripAssertions } from './extractor.js';

/**
 * VitePress markdown code transformer that strips doctest-hidden lines and optionally assertions
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
    // First strip hidden lines, then strip assertions
    let result = stripHiddenLines(code);
    result = stripAssertions(result);
    return result;
  },
};

/**
 * Strip doctest-hidden lines from code
 * Re-exported for convenience
 */
export { stripHiddenLines, stripAssertions };
