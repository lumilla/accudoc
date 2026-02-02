import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findMarkdownFiles } from './runner.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('runner', () => {
  describe('findMarkdownFiles', () => {
    const testDirs: string[] = [];

    beforeEach(() => {
      // Clear any leftover test directories
      testDirs.forEach((dir) => {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
      });
      testDirs.length = 0;
    });

    afterEach(() => {
      // Cleanup after each test
      testDirs.forEach((dir) => {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
      });
      testDirs.length = 0;
    });

    it('finds markdown files in directory', () => {
      const testDir = join(
        process.cwd(),
        `src/.test-fixtures-${Date.now()}-${Math.random()}`
      );
      testDirs.push(testDir);

      // Create test structure
      mkdirSync(testDir, { recursive: true });
      mkdirSync(join(testDir, 'nested'), { recursive: true });

      writeFileSync(join(testDir, 'readme.md'), '# Test');
      writeFileSync(join(testDir, 'guide.md'), '# Guide');
      writeFileSync(join(testDir, 'nested', 'nested.md'), '# Nested');
      writeFileSync(join(testDir, 'ignored.txt'), 'Not markdown');

      const files = findMarkdownFiles(testDir);

      expect(files.length).toBe(3);
      expect(files.some((f: string) => f.endsWith('readme.md'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('guide.md'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('nested.md'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('ignored.txt'))).toBe(
        false
      );
    });

    it('returns empty array for non-existent directory', () => {
      const files = findMarkdownFiles(
        join(process.cwd(), `src/.non-existent-${Date.now()}`)
      );

      expect(files).toEqual([]);
    });

    it('skips node_modules and hidden directories', () => {
      const testDir = join(
        process.cwd(),
        `src/.test-fixtures-2-${Date.now()}-${Math.random()}`
      );
      testDirs.push(testDir);

      // Create test structure
      mkdirSync(testDir, { recursive: true });
      mkdirSync(join(testDir, 'node_modules'), { recursive: true });
      mkdirSync(join(testDir, '.hidden'), { recursive: true });
      mkdirSync(join(testDir, 'src'), { recursive: true });

      writeFileSync(join(testDir, 'readme.md'), '# Test');
      writeFileSync(
        join(testDir, 'node_modules', 'pkg.md'),
        '# Should be skipped'
      );
      writeFileSync(
        join(testDir, '.hidden', 'hidden.md'),
        '# Should be skipped'
      );
      writeFileSync(join(testDir, 'src', 'docs.md'), '# Included');

      const files = findMarkdownFiles(testDir);

      expect(files.length).toBe(2);
      expect(files.some((f: string) => f.endsWith('readme.md'))).toBe(true);
      expect(files.some((f: string) => f.endsWith('docs.md'))).toBe(true);
      expect(files.some((f: string) => f.includes('node_modules'))).toBe(
        false
      );
      expect(files.some((f: string) => f.includes('.hidden'))).toBe(false);
    });
  });
});
