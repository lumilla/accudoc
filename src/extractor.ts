import type { Doctest } from './types.js';

/**
 * Extract doctest code blocks from markdown content
 *
 * Code blocks must have a language tag followed by `doctest`:
 * ```javascript doctest
 * console.log('This will be tested!');
 * ```
 *
 * Supported languages: javascript, js, typescript, ts, tsx, jsx
 */
export function extractDoctests(content: string, filePath: string): Doctest[] {
  const doctests: Doctest[] = [];

  // Match code blocks with doctest marker
  // Supports: ```javascript doctest, ```js doctest, ```typescript doctest, ```tsx doctest
  // Handle both Unix (\n) and Windows (\r\n) line endings
  const codeBlockRegex = /```(javascript|js|typescript|ts|tsx|jsx)\s+doctest\r?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  let lineNumber = 1;
  let lastIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Calculate line number by counting newlines before this match
    const precedingContent = content.slice(lastIndex, match.index);
    lineNumber += (precedingContent.match(/\n/g) || []).length;

    const language = match[1];
    const isTsx = language === 'tsx' || language === 'jsx';

    doctests.push({
      code: match[2].trim(),
      line: lineNumber,
      file: filePath,
      isTsx,
      language,
    });

    // Count lines in the code block itself for next iteration
    lineNumber += (match[0].match(/\n/g) || []).length;
    lastIndex = match.index + match[0].length;
  }

  return doctests;
}

/**
 * Strip lines marked with doctest-hidden or doctest-only from code
 * These lines are executed in tests but hidden from documentation
 */
export function stripHiddenLines(code: string): string {
  return code
    .split('\n')
    .filter((line) => !line.match(/\/\/\s*(doctest-hidden|doctest-only)\s*$/))
    .join('\n');
}
