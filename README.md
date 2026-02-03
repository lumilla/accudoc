# Accudoc

Accudoc is Accurate Documentation.
Rust-style doctests for JavaScript and TypeScript markdown documentation.

[![Tests](https://github.com/lumilla/accudoc/actions/workflows/test.yml/badge.svg)](https://github.com/lumilla/accudoc/actions)
[![npm](https://img.shields.io/npm/v/accudoc?style=flat-square)](https://www.npmjs.com/package/accudoc)
[![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)](https://www.typescriptlang.org/)
[![License: LGPL v3](https://img.shields.io/github/license/lumilla/accudoc)](LICENSE)

Accudoc extracts code blocks from your markdown documentation and executes them, ensuring your docs stay accurate and examples actually work.


## Installation

```bash
npm install -D accudoc
```

## Usage

### Basic Setup

Add `doctest` after the language tag in your markdown:

````markdown
```javascript doctest
import { defineConfig } from 'accudoc';

const config = defineConfig({ docs: './docs' });
assert(config.docs === './docs');
```
````

### Configuration

Create an `accudoc.config.js` file in your project root:

```js
// accudoc.config.js
import { defineConfig } from 'accudoc';

export default defineConfig({
  docs: './docs',
  imports: {
    '@mylib/core': './dist/index.js',
    '@mylib/styles.css': null, // ignore CSS imports
  },
});
```

### Run Tests

```bash
npx accudoc
```

### Configuration Options

```typescript
interface AccudocConfig {
  docs?: string;                           // Directory containing markdown files (default: './docs')
  imports?: Record<string, string | null>; // Import path mappings (null to ignore)
  setup?: () => TestEnvironment;           // Custom environment setup
  jsx?: 'react' | 'vue' | false;          // JSX transformation mode (default: 'react')
  include?: string[];                      // File patterns to include (default: ['**/*.md'])
  exclude?: string[];                      // File patterns to exclude (default: ['node_modules/**'])
  verbose?: boolean;                       // Show detailed output (default: false)
  stripAssertions?: boolean;               // Strip assertion calls from docs (default: true)
}
```

### Advanced Configuration

```js
// accudoc.config.js
import { defineConfig, createDomEnvironment } from 'accudoc';

export default defineConfig({
  docs: './docs',
  
  imports: {
    '@mylib/core': './dist/core.js',
    '@mylib/utils': './dist/utils.js',
    '@mylib/styles.css': null,
  },
  
  setup: () => {
    const env = createDomEnvironment();
    env.MY_GLOBAL = 'test-value';
    return env;
  },
  
  jsx: 'react',
  verbose: true,
});
```

### Hidden Assertions

Add assertions that run in tests but don't appear in rendered documentation:

By default, all assertion function calls are automatically stripped from rendered documentation while still being executed during tests. This keeps your docs clean and focused on the actual code examples.

```javascript doctest
import { defineConfig } from 'accudoc';

const config = defineConfig({ docs: './docs', jsx: 'react' });
console.log(config.docs); // Output: ./docs

// These assertions are hidden in rendered docs but run in tests:
assert(config.docs === './docs');
assert(config.jsx === 'react');
```

To force-show an assertion in the rendered documentation, add a `// doctest-show` comment:

```javascript doctest
const result = 1 + 1;
console.log(result); // Output: 2
assertEqual(result, 2); // doctest-show
```

In rendered docs, this will display:
```javascript
const result = 1 + 1;
console.log(result); // Output: 2
assertEqual(result, 2);
```

You can also hide other lines without showing assertions by using `// doctest-hidden`:

````markdown
```javascript doctest
const secret = 'hidden value';
console.log('visible output');
console.log(secret); // doctest-hidden
```
````

Lines ending with `// doctest-hidden` or `// doctest-only` are executed during tests but stripped from rendered documentation.

### Controlling Assertion Stripping

Configure assertion stripping in your config file:

```js
// accudoc.config.js
import { defineConfig } from 'accudoc';

export default defineConfig({
  docs: './docs',
  stripAssertions: true, // Strip all assertions by default (default: true)
});
```

When `stripAssertions` is `false`, all assertion calls will be shown in rendered documentation.

### Assertion API

Accudoc provides a comprehensive assertion API that throws errors on failure, ensuring your doctests actually catch bugs:

```javascript doctest
// Basic assertion
assert(true, 'This passes');

// Equality checks
assertEqual(1 + 1, 2);
assertEqual('hello', 'hello');

// Deep equality for objects and arrays
assertDeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
assertDeepEqual([1, 2, 3], [1, 2, 3]);
```

Available assertion functions:
- `assert(value, message?)` - Assert value is truthy
- `assertEqual(actual, expected, message?)` - Strict equality (===)
- `assertDeepEqual(actual, expected, message?)` - Deep equality for objects/arrays
- `assertNotEqual(actual, expected, message?)` - Values are not equal
- `assertThrows(fn, ErrorType?, message?)` - Function throws an error
- `assertThrowsAsync(fn, ErrorType?, message?)` - Async function throws
- `assertNullish(value, message?)` - Value is null or undefined
- `assertTruthy(value, message?)` - Value is truthy
- `assertFalsy(value, message?)` - Value is falsy
- `assertInstanceOf(value, Type, message?)` - Value is instance of Type
- `assertMatch(string, regex, message?)` - String matches regex
- `assertIncludes(array, value, message?)` - Array includes value

All assertion functions are automatically available in your doctests without importing them.

### Programmatic API

```ts
import { runDoctests, defineConfig } from 'accudoc';

const config = defineConfig({
  docs: './docs',
  imports: { '@mylib/core': './dist/index.js' },
});

const summary = await runDoctests(config, process.cwd());

console.log(`${summary.totalPassed}/${summary.totalTests} passed`);
```

### CLI Options

```
accudoc [options]

Options:
  -v, --verbose    Show detailed output including stack traces
  -h, --help       Show help message
  -V, --version    Show version number
```

## Features

- **Import Mapping**: Map package imports to local build output for testing before publishing
- **React support**: React component testing with OXC transformation of TSX/JSX
- **DOM Mocking**: Built-in browser environment for frontend code testing
- **Hidden Assertions**: Test assertions that don't clutter your documentation
- **VitePress Integration**: Automatically strip hidden lines from rendered docs

### Supported Languages

Code blocks with these language tags can be tested:
- `javascript` / `js`
- `typescript` / `ts`
- `tsx`
- `jsx`

### VitePress Integration

Automatically strip hidden lines from your VitePress documentation:

```ts
// docs/.vitepress/config.ts
import { defineConfig } from 'vitepress';
import { accudocTransformer } from 'accudoc/vitepress';

export default defineConfig({
  markdown: {
    codeTransformers: [accudocTransformer],
  },
});
```

## Development

### Scripts

```bash
npm run build        # Build for production
npm run dev          # Build in watch mode
npm test             # Run doctests
```

### Building

The library builds to ES modules:

- `dist/index.js` - Entry point
- `dist/cli.js` - CLI entry point
- `dist/vitepress.js` - VitePress transformer
- `dist/index.d.ts` - TypeScript declarations

### Testing

Accudoc dogfoods itself by running doctests on its own README.

```bash
npm test
```

### CI & Artifacts

CI runs on every PR with GitHub Actions (`.github/workflows/test.yml`).
When tests and checks succeed, a job runs and uploads an artifact containing `dist/`.

#### Publishing

Publishing to npm is handled by `.github/workflows/publish.yml` which runs on pushes with tags matching `v*` or manual dispatch.
Published on npm under package `accudoc`.

## How It Works

1. **Extract** - Scans markdown files for code blocks with the `doctest` marker
2. **Transform** - Rewrites imports based on your config, transforms JSX with OXC
3. **Mock** - Sets up a DOM environment for browser code
4. **Execute** - Runs each code block and catches any errors
5. **Report** - Shows which doctests passed or failed with line numbers

## License

Licensed under the GNU Lesser General Public License v3
