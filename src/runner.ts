import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';
import type {
  AccudocConfig,
  Doctest,
  DoctestResult,
  FileResult,
  RunSummary,
  TestEnvironment,
} from './types.js';
import { extractDoctests } from './extractor.js';
import { transformCode } from './transformer.js';
import { createDomEnvironment, applyEnvironment } from './environment.js';
import * as assertions from './assert.js';

/**
 * Find all markdown files in a directory recursively
 */
export function findMarkdownFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      findMarkdownFiles(fullPath, files);
    } else if (stat.isFile() && extname(entry) === '.md') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Run a single doctest
 */
export async function runDoctest(
  doctest: Doctest,
  config: AccudocConfig,
  env: TestEnvironment
): Promise<DoctestResult> {
  try {
    const transformedCode = await transformCode(doctest.code, doctest.isTsx, config);

    // Apply environment to global scope
    applyEnvironment(env);

    // Create async wrapper function with assertions and environment injected
    // Pass assertions and environment as parameters to avoid scope issues
    const wrappedCode = `
      return (async function(assert, assertEqual, assertDeepEqual, assertNotEqual, assertThrows, assertThrowsAsync, assertNullish, assertTruthy, assertFalsy, assertInstanceOf, assertMatch, assertIncludes, AssertionError) {
        ${transformedCode}
      })(...arguments)
    `;

    // Execute the code with assertions passed as arguments
    const fn = new Function(wrappedCode);
    await fn.call(
      env,
      assertions.assert,
      assertions.assertEqual,
      assertions.assertDeepEqual,
      assertions.assertNotEqual,
      assertions.assertThrows,
      assertions.assertThrowsAsync,
      assertions.assertNullish,
      assertions.assertTruthy,
      assertions.assertFalsy,
      assertions.assertInstanceOf,
      assertions.assertMatch,
      assertions.assertIncludes,
      assertions.AssertionError
    );

    return { success: true };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      stack: err.stack,
    };
  }
}

/**
 * Process a single markdown file
 */
export async function processFile(
  filePath: string,
  config: AccudocConfig,
  env: TestEnvironment,
  projectRoot: string
): Promise<FileResult> {
  const relativeFile = relative(projectRoot, filePath);
  const content = readFileSync(filePath, 'utf-8');
  const doctests = extractDoctests(content, filePath);

  const results: FileResult['results'] = [];
  let passed = 0;
  let failed = 0;

  for (const doctest of doctests) {
    const result = await runDoctest(doctest, config, env);
    results.push({ doctest, result });

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  return {
    file: relativeFile,
    passed,
    failed,
    total: doctests.length,
    results,
  };
}

/**
 * Run all doctests
 */
export async function runDoctests(config: AccudocConfig, projectRoot: string): Promise<RunSummary> {
  const docsDir = join(projectRoot, config.docs ?? 'docs');

  // Find all markdown files
  const files = findMarkdownFiles(docsDir);

  // Create or get test environment
  let env: TestEnvironment;
  if (config.setup) {
    env = await config.setup();
  } else {
    env = createDomEnvironment();
  }

  // Process all files
  const fileResults: FileResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  for (const file of files) {
    const result = await processFile(file, config, env, projectRoot);

    if (result.total > 0) {
      fileResults.push(result);
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += result.total;
    }
  }

  return {
    files: fileResults,
    totalPassed,
    totalFailed,
    totalTests,
  };
}
