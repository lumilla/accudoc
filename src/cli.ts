#!/usr/bin/env node
/* eslint-disable no-console */
// this filename is... unfortunate, but it's the CLI entrypoint
// (also it's actually really funny to say see cli.ts)

import { relative } from 'path';
import { loadConfig } from './config.js';
import { runDoctests } from './runner.js';
import type { AccudocConfig } from './types.js';

// ANSI styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  white: '\x1b[37m',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function parseArgs(args: string[]): { verbose: boolean; help: boolean; version: boolean } {
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h'),
    version: args.includes('--version') || args.includes('-V'),
  };
}

function showHelp(): void {
  console.log(`
${c.cyan}${c.bold}ACCUDOC${c.reset} ${c.dim}v1.0.0${c.reset}
${c.dim}Rust-style doctests for JavaScript/TypeScript markdown${c.reset}

${c.yellow}USAGE${c.reset}
  ${c.dim}$${c.reset} accudoc ${c.dim}[options]${c.reset}

${c.yellow}OPTIONS${c.reset}
  ${c.green}-v, --verbose${c.reset}    Show detailed output including stack traces
  ${c.green}-h, --help${c.reset}       Show this help message
  ${c.green}-V, --version${c.reset}    Show version number

${c.yellow}CONFIGURATION${c.reset}
  Create an ${c.cyan}accudoc.config.js${c.reset} file in your project root:

  ${c.dim}import { defineConfig } from 'accudoc';
  
  export default defineConfig({
    docs: './docs',
    imports: {
      '@mylib/core': './dist/index.js',
      '@mylib/styles.css': null,
    },
    jsx: 'react',
  });${c.reset}

${c.yellow}CODE BLOCKS${c.reset}
  Add ${c.cyan}doctest${c.reset} after the language tag to mark testable blocks:

  ${c.dim}\`\`\`javascript doctest
  import { myFunction } from '@mylib/core';
  console.assert(myFunction() === 42);
  \`\`\`${c.reset}

${c.yellow}HIDDEN ASSERTIONS${c.reset}
  Lines ending with ${c.cyan}// doctest-hidden${c.reset} or ${c.cyan}// doctest-only${c.reset}
  are executed in tests but hidden from rendered documentation.
`);
}

async function main(): Promise<void> {
  const startTime = performance.now();
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    return;
  }

  if (args.version) {
    const pkg = await import('../package.json', { with: { type: 'json' } });
    console.log(pkg.default.version);
    return;
  }

  const projectRoot = process.cwd();

  // Load configuration
  const config: AccudocConfig = await loadConfig(projectRoot);
  config.verbose = config.verbose || args.verbose;

  // Print header
  console.log();
  console.log(`${c.green}${c.bold} ACCUDOC ${c.reset} v1.0.0 ${c.dim}${projectRoot}${c.reset}`);
  console.log();

  // Run doctests
  const summary = await runDoctests(config, projectRoot);

  // Print results per file
  for (const file of summary.files) {
    const fileLabel = relative(projectRoot, file.file) || file.file;

    if (file.failed === 0) {
      console.log(
        `${c.green} ✓ ${c.reset}${c.dim}${fileLabel}${c.reset} ${c.dim}(${file.passed}/${file.total})${c.reset}`
      );
    } else {
      console.log(
        `${c.red} ✗ ${c.reset}${fileLabel} ${c.dim}(${file.passed}/${file.total})${c.reset}`
      );
    }

    for (const { doctest, result } of file.results) {
      if (!result.success) {
        console.log(`   ${c.red}× doctest @ line ${doctest.line}${c.reset}`);
      }
    }
  }

  const duration = formatDuration(Math.round(performance.now() - startTime));

  // Print detailed errors for failures
  const failedFiles = summary.files.filter((f) => f.failed > 0);
  if (failedFiles.length > 0) {
    console.log();
    console.log(`${c.bold}${c.red} FAILED TESTS ${c.reset}`);
    console.log();

    for (const file of failedFiles) {
      const fileLabel = relative(projectRoot, file.file) || file.file;

      for (const { doctest, result } of file.results) {
        if (!result.success) {
          console.log(
            `${c.red} × ${c.reset}${c.bold}${fileLabel} > doctest @ line ${doctest.line}${c.reset}`
          );

          if (result.error) {
            const errorLines = result.error.split('\n');
            for (const line of errorLines) {
              console.log(`   ${c.red}${line}${c.reset}`);
            }
          }

          if (config.verbose && result.stack) {
            console.log();
            const stackLines = result.stack.split('\n').slice(1, 6);
            for (const line of stackLines) {
              console.log(`   ${c.dim}${line.trim()}${c.reset}`);
            }
          }
          console.log();
        }
      }
    }
  }

  // Summary line
  console.log();

  if (summary.totalTests === 0) {
    console.log(`${c.yellow} No doctests found${c.reset}`);
    console.log();
    console.log(
      `${c.dim} Add \`doctest\` after the language tag in your markdown code blocks:${c.reset}`
    );
    console.log();
    console.log(`   ${c.dim}\`\`\`javascript doctest${c.reset}`);
    console.log(`   ${c.dim}console.assert(1 + 1 === 2);${c.reset}`);
    console.log(`   ${c.dim}\`\`\`${c.reset}`);
    console.log();
  } else {
    const filesCount = summary.files.length;

    if (summary.totalFailed === 0) {
      console.log(
        `${c.bold}${c.green} Test Files ${c.reset} ${c.green}${filesCount} passed${c.reset} ${c.dim}(${filesCount})${c.reset}`
      );
      console.log(
        `${c.bold}${c.green}      Tests ${c.reset} ${c.green}${summary.totalPassed} passed${c.reset} ${c.dim}(${summary.totalPassed})${c.reset}`
      );
    } else {
      const failedFilesCount = failedFiles.length;
      const passedFilesCount = filesCount - failedFilesCount;

      console.log(
        `${c.bold}${c.red} Test Files ${c.reset} ` +
          `${c.red}${failedFilesCount} failed${c.reset} ${c.dim}|${c.reset} ` +
          `${c.green}${passedFilesCount} passed${c.reset} ${c.dim}(${filesCount})${c.reset}`
      );
      console.log(
        `${c.bold}${c.red}      Tests ${c.reset} ` +
          `${c.red}${summary.totalFailed} failed${c.reset} ${c.dim}|${c.reset} ` +
          `${c.green}${summary.totalPassed} passed${c.reset} ${c.dim}(${summary.totalTests})${c.reset}`
      );
    }

    console.log(`${c.bold}   Start at ${c.reset}${new Date().toTimeString().split(' ')[0]}`);
    console.log(`${c.bold}   Duration ${c.reset}${duration}`);
    console.log();

    if (summary.totalFailed > 0) {
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(`${c.red}${c.bold}error${c.reset}${c.red}:${c.reset} ${error.message}`);
  process.exit(1);
});
