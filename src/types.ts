/**
 * Accudoc Configuration
 */
export interface AccudocConfig {
  /**
   * Directory containing markdown files to test
   * @default './docs'
   */
  docs?: string;

  /**
   * Import path mappings
   * Maps import specifiers to actual file paths
   * Set to `null` to ignore an import (e.g., CSS files)
   *
   * @example
   * ```js
   * imports: {
   *   '@mylib/core': './dist/index.js',
   *   '@mylib/styles.css': null,
   * }
   * ```
   */
  imports?: Record<string, string | null>;

  /**
   * Setup function called before running doctests
   * Use this to set up global mocks, DOM environment, etc.
   */
  setup?: () => TestEnvironment | Promise<TestEnvironment>;

  /**
   * JSX transform mode
   * - 'react': Transform JSX for React
   * - 'vue': Transform JSX for Vue (not yet implemented)
   * - false: No JSX transformation
   * @default 'react'
   */
  jsx?: 'react' | 'vue' | false;

  /**
   * File patterns to include
   * @default ['**\/*.md']
   */
  include?: string[];

  /**
   * File patterns to exclude
   * @default ['node_modules/**']
   */
  exclude?: string[];

  /**
   * Whether to run in verbose mode
   * @default false
   */
  verbose?: boolean;

  /**
   * Strip assertion function calls from rendered documentation
   * Assertions are still executed in tests but hidden from docs
   * Use `// doctest-show` comment to force-show specific assertions
   * @default true
   */
  stripAssertions?: boolean;
}

/**
 * Test environment with mocked globals
 */
export interface TestEnvironment {
  document?: unknown;
  window?: unknown;
  [key: string]: unknown;
}

/**
 * A single doctest extracted from markdown
 */
export interface Doctest {
  /** The code to execute */
  code: string;
  /** Line number in the source file */
  line: number;
  /** Source file path */
  file: string;
  /** Whether this is TSX/JSX code */
  isTsx: boolean;
  /** The language tag from the code block */
  language: string;
}

/**
 * Result of running a single doctest
 */
export interface DoctestResult {
  success: boolean;
  error?: string;
  stack?: string;
}

/**
 * Summary of doctest run for a file
 */
export interface FileResult {
  file: string;
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    doctest: Doctest;
    result: DoctestResult;
  }>;
}

/**
 * Overall doctest run summary
 */
export interface RunSummary {
  files: FileResult[];
  totalPassed: number;
  totalFailed: number;
  totalTests: number;
}
