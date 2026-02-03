import { transform } from 'oxc-transform';
import { resolve } from 'path';
import type { AccudocConfig } from './types.js';

/**
 * Transform code for execution in Node.js via new Function()
 * Converts ESM imports to dynamic imports
 */
export async function transformCode(
  code: string,
  isTsx: boolean,
  config: AccudocConfig
): Promise<string> {
  const imports = config.imports ?? {};

  // Transform import statements based on config
  for (const [specifier, replacement] of Object.entries(imports)) {
    const escapedSpecifier = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (replacement === null) {
      // Remove import entirely (for CSS, etc.)
      code = code.replace(
        new RegExp(`import\\s+['"]${escapedSpecifier}['"];?\\s*`, 'g'),
        '// import removed\n'
      );
      code = code.replace(
        new RegExp(`import\\s+[^;]+\\s+from\\s+['"]${escapedSpecifier}['"];?\\s*`, 'g'),
        '// import removed\n'
      );
    } else {
      // Resolve to absolute path if it's a relative path
      const resolvedPath = replacement.startsWith('.')
        ? resolve(process.cwd(), replacement)
        : replacement;

      // Convert to file:// URL on Windows to handle absolute paths correctly
      const importPath =
        resolvedPath.match(/^[a-zA-Z]:/) || resolvedPath.startsWith('/')
          ? `file:///${resolvedPath.replace(/\\/g, '/')}`
          : resolvedPath;

      // Convert static imports to dynamic imports
      // Handle: import { Foo, Bar } from 'pkg' -> const { Foo, Bar } = await import('path')
      code = code.replace(
        new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${escapedSpecifier}['"];?`, 'g'),
        `const {$1} = await import('${importPath}')`
      );

      // Handle: import Foo from 'pkg' -> const { default: Foo } = await import('path')
      code = code.replace(
        new RegExp(`import\\s+(\\w+)\\s+from\\s+['"]${escapedSpecifier}['"];?`, 'g'),
        `const { default: $1 } = await import('${importPath}')`
      );

      // Handle: import * as Foo from 'pkg' -> const Foo = await import('path')
      code = code.replace(
        new RegExp(`import\\s+\\*\\s+as\\s+(\\w+)\\s+from\\s+['"]${escapedSpecifier}['"];?`, 'g'),
        `const $1 = await import('${importPath}')`
      );

      // Handle dynamic imports: import('pkg') -> import('path')
      code = code.replace(
        new RegExp(`import\\s*\\(\\s*['"]${escapedSpecifier}['"]\\s*\\)`, 'g'),
        `import('${importPath}')`
      );
    }
  }

  // Handle React imports - mock them for Node.js execution
  code = code.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/g, (_, imports) => {
    const importList = imports.split(',').map((s: string) => s.trim());
    const mocks: string[] = [];

    for (const imp of importList) {
      const name = imp.split(/\s+as\s+/)[0].trim();
      switch (name) {
        case 'useRef':
          mocks.push('useRef: (initial) => ({ current: initial })');
          break;
        case 'useState':
          mocks.push('useState: (initial) => [initial, () => {}]');
          break;
        case 'useEffect':
          mocks.push('useEffect: (fn) => fn()');
          break;
        case 'useCallback':
          mocks.push('useCallback: (fn) => fn');
          break;
        case 'useMemo':
          mocks.push('useMemo: (fn) => fn()');
          break;
        case 'useContext':
          mocks.push('useContext: () => ({})');
          break;
        case 'useReducer':
          mocks.push('useReducer: (_, init) => [init, () => {}]');
          break;
        case 'useImperativeHandle':
          mocks.push('useImperativeHandle: () => {}');
          break;
        case 'useLayoutEffect':
          mocks.push('useLayoutEffect: (fn) => fn()');
          break;
        case 'forwardRef':
          mocks.push('forwardRef: (fn) => fn');
          break;
        case 'createContext':
          mocks.push('createContext: (val) => ({ Provider: () => val, Consumer: () => val })');
          break;
        case 'memo':
          mocks.push('memo: (fn) => fn');
          break;
        case 'Fragment':
          mocks.push('Fragment: "Fragment"');
          break;
        case 'createElement':
          mocks.push('createElement: (type, props, ...children) => ({ type, props, children })');
          break;
        default:
          mocks.push(`${name}: () => {}`);
      }
    }

    return `const { ${importList.join(', ')} } = {\n  ${mocks.join(',\n  ')}\n};`;
  });

  // Handle type-only imports (remove them - they're TypeScript-only)
  code = code.replace(
    /import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g,
    '// type import removed\n'
  );

  // Transform interface/type declarations (remove them)
  code = code.replace(
    /^(export\s+)?(interface|type)\s+\w+[^{]*\{[^}]*\};?\s*$/gm,
    '// type declaration removed'
  );

  // Transform TSX/JSX to plain JavaScript using OXC
  if (isTsx && config.jsx !== false) {
    try {
      const result = await transform('doctest.tsx', code, {
        jsx: config.jsx === 'vue' ? 'preserve' : { runtime: 'automatic' },
      });

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors
          .map((e: unknown) =>
            typeof e === 'string' ? e : ((e as { message?: string }).message ?? String(e))
          )
          .join('\n');
        throw new Error(errorMessages);
      }

      code = result.code;
    } catch (e) {
      throw new Error(`JSX transform failed: ${(e as Error).message}`);
    }
  }

  return code;
}
