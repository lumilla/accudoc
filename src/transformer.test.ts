import { describe, it, expect } from 'vitest';
import { transformCode } from './transformer.js';

describe('transformer', () => {
  it('transforms basic import to dynamic import', async () => {
    const code = `import { defineConfig } from 'accudoc';\nconsole.log(defineConfig);`;
    const config = {
      imports: {
        accudoc: './dist/index.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`const { defineConfig } = await import('./dist/index.js')`);
    expect(result).not.toContain(`import { defineConfig }`);
  });

  it('transforms default import correctly', async () => {
    const code = `import Config from 'config';\nconsole.log(Config);`;
    const config = {
      imports: {
        config: './dist/config.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`const { default: Config } = await import('./dist/config.js')`);
  });

  it('transforms namespace import correctly', async () => {
    const code = `import * as utils from 'utils';\nconsole.log(utils);`;
    const config = {
      imports: {
        utils: './dist/utils.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`const utils = await import('./dist/utils.js')`);
  });

  it('removes imports marked with null replacement', async () => {
    const code = `import '@mylib/styles.css';\nconsole.log('loaded');`;
    const config = {
      imports: {
        '@mylib/styles.css': null,
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain('// import removed');
    expect(result).not.toContain("import '@mylib/styles.css'");
  });

  it('transforms dynamic imports', async () => {
    const code = `const module = import('pkg');\nconsole.log(module);`;
    const config = {
      imports: {
        pkg: './dist/pkg.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`import('./dist/pkg.js')`);
  });

  it('handles multiple imports from same package', async () => {
    const code = `import { foo, bar, baz } from 'lib';\nconsole.log(foo, bar, baz);`;
    const config = {
      imports: {
        lib: './dist/lib.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`const { foo, bar, baz } = await import('./dist/lib.js')`);
  });

  it('mocks React hooks when present', async () => {
    const code = `import { useState, useEffect } from 'react';\nconsole.log(useState);`;
    const config = {
      imports: {},
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain('useState:');
    expect(result).toContain('useEffect:');
  });

  it('preserves code without imports', async () => {
    const code = `const x = 42;\nconsole.log(x);`;
    const config = {
      imports: {},
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain('const x = 42;');
    expect(result).toContain('console.log(x);');
  });

  it('handles special characters in import names', async () => {
    const code = `import { foo } from '@myorg/my-lib';\nconsole.log(foo);`;
    const config = {
      imports: {
        '@myorg/my-lib': './dist/lib.js',
      },
    };

    const result = await transformCode(code, false, config);

    expect(result).toContain(`const { foo } = await import('./dist/lib.js')`);
  });
});
