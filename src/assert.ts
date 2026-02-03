/**
 * Assertion API for doctests
 * Provides assertion functions that actually throw errors on failure
 */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * Assert that a value is truthy
 */
export function assert(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new AssertionError(message || 'Assertion failed');
  }
}

/**
 * Assert that two values are strictly equal (===)
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      message ||
        `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that two values are deeply equal
 */
export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  if (!deepEqual(actual, expected)) {
    throw new AssertionError(
      message ||
        `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that two values are not strictly equal (!==)
 */
export function assertNotEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual === expected) {
    throw new AssertionError(
      message || `Expected values to not be equal, but both are ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Assert that a function throws an error
 */
export function assertThrows(
  fn: () => unknown,
  errorType?: new (...args: unknown[]) => Error,
  message?: string
): void {
  let threw = false;
  let error: unknown;

  try {
    fn();
  } catch (e) {
    threw = true;
    error = e;
  }

  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw, but it did not');
  }

  if (errorType && !(error instanceof errorType)) {
    throw new AssertionError(
      message ||
        `Expected function to throw ${errorType.name}, but it threw ${(error as Error).constructor.name}`
    );
  }
}

/**
 * Assert that an async function throws an error
 */
export async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  errorType?: new (...args: unknown[]) => Error,
  message?: string
): Promise<void> {
  let threw = false;
  let error: unknown;

  try {
    await fn();
  } catch (e) {
    threw = true;
    error = e;
  }

  if (!threw) {
    throw new AssertionError(message || 'Expected async function to throw, but it did not');
  }

  if (errorType && !(error instanceof errorType)) {
    throw new AssertionError(
      message ||
        `Expected async function to throw ${errorType.name}, but it threw ${(error as Error).constructor.name}`
    );
  }
}

/**
 * Assert that a value is null or undefined
 */
export function assertNullish(value: unknown, message?: string): void {
  if (value !== null && value !== undefined) {
    throw new AssertionError(
      message || `Expected null or undefined, but got ${JSON.stringify(value)}`
    );
  }
}

/**
 * Assert that a value is truthy
 */
export function assertTruthy(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new AssertionError(message || `Expected truthy value, but got ${JSON.stringify(value)}`);
  }
}

/**
 * Assert that a value is falsy
 */
export function assertFalsy(value: unknown, message?: string): void {
  if (value) {
    throw new AssertionError(message || `Expected falsy value, but got ${JSON.stringify(value)}`);
  }
}

/**
 * Assert that a value is an instance of a class
 */
export function assertInstanceOf<T>(
  value: unknown,
  type: new (...args: unknown[]) => T,
  message?: string
): asserts value is T {
  if (!(value instanceof type)) {
    throw new AssertionError(
      message ||
        `Expected instance of ${type.name}, but got ${value?.constructor?.name || typeof value}`
    );
  }
}

/**
 * Assert that a value matches a regular expression
 */
export function assertMatch(value: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(value)) {
    throw new AssertionError(
      message || `Expected "${value}" to match pattern ${pattern}, but it did not`
    );
  }
}

/**
 * Assert that an array includes a value
 */
export function assertIncludes<T>(array: T[], value: T, message?: string): void {
  if (!array.includes(value)) {
    throw new AssertionError(
      message || `Expected array to include ${JSON.stringify(value)}, but it did not`
    );
  }
}

// Helper function for deep equality check
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Handle objects
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}
