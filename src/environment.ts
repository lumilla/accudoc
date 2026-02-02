import type { TestEnvironment } from './types.js';

/**
 * Create a default DOM mock environment for testing browser code in Node.js
 */
export function createDomEnvironment(): TestEnvironment {
  const mockElement: Record<string, unknown> = {
    innerHTML: '',
    textContent: '',
    appendChild: () => mockElement,
    removeChild: () => mockElement,
    insertBefore: () => mockElement,
    replaceChild: () => mockElement,
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    hasAttribute: () => false,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    contains: () => false,
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 100,
      height: 30,
      x: 0,
      y: 0,
    }),
    getClientRects: () => [],
    style: new Proxy({}, { get: () => '', set: () => true }),
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => false,
      contains: () => false,
      replace: () => false,
    },
    dataset: {},
    focus: () => {},
    blur: () => {},
    click: () => {},
    children: [],
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
    parentNode: null,
    parentElement: null,
    ownerDocument: null,
    nodeType: 1,
    nodeName: 'DIV',
    tagName: 'DIV',
    cloneNode: () => ({ ...mockElement }),
    remove: () => {},
  };

  // Self-references
  mockElement.parentNode = mockElement;
  mockElement.parentElement = mockElement;

  const createElement = (tag: string) => ({
    ...mockElement,
    tagName: tag.toUpperCase(),
    nodeName: tag.toUpperCase(),
    children: [],
    childNodes: [],
  });

  const mockDocument = {
    createElement,
    createElementNS: (_ns: string, tag: string) => createElement(tag),
    createTextNode: (text: string) => ({ textContent: text, nodeType: 3, nodeName: '#text' }),
    createComment: (text: string) => ({ textContent: text, nodeType: 8, nodeName: '#comment' }),
    createDocumentFragment: () => ({ ...mockElement, nodeType: 11 }),
    getElementById: () => mockElement,
    querySelector: () => mockElement,
    querySelectorAll: () => [],
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    body: {
      ...mockElement,
      tagName: 'BODY',
      nodeName: 'BODY',
    },
    head: {
      ...mockElement,
      tagName: 'HEAD',
      nodeName: 'HEAD',
    },
    documentElement: {
      ...mockElement,
      tagName: 'HTML',
      nodeName: 'HTML',
    },
    activeElement: mockElement,
    addEventListener: () => {},
    removeEventListener: () => {},
    createRange: () => ({
      setStart: () => {},
      setEnd: () => {},
      collapse: () => {},
      selectNode: () => {},
      selectNodeContents: () => {},
      getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
      getClientRects: () => [],
      cloneRange: function () {
        return this;
      },
      detach: () => {},
      createContextualFragment: () => ({ ...mockElement, nodeType: 11 }),
    }),
    getSelection: () => ({
      removeAllRanges: () => {},
      addRange: () => {},
      getRangeAt: () => null,
      rangeCount: 0,
      anchorNode: null,
      focusNode: null,
    }),
  };

  const mockWindow = {
    document: mockDocument,
    getSelection: () => mockDocument.getSelection(),
    getComputedStyle: () => new Proxy({}, { get: () => '' }),
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb: () => void) => setTimeout(cb, 16),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    MutationObserver: class {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
    ResizeObserver: class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
    IntersectionObserver: class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
    matchMedia: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    navigator: {
      userAgent: 'accudoc',
      platform: 'Node',
      language: 'en',
    },
    location: {
      href: 'http://localhost/',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
    },
    history: {
      pushState: () => {},
      replaceState: () => {},
      back: () => {},
      forward: () => {},
      go: () => {},
      length: 0,
    },
    localStorage: createMockStorage(),
    sessionStorage: createMockStorage(),
    innerWidth: 1024,
    innerHeight: 768,
    scrollX: 0,
    scrollY: 0,
    scrollTo: () => {},
    scroll: () => {},
  };

  return {
    document: mockDocument,
    window: mockWindow,
  };
}

function createMockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

/**
 * Apply environment to globalThis
 */
export function applyEnvironment(env: TestEnvironment): void {
  for (const [key, value] of Object.entries(env)) {
    (globalThis as Record<string, unknown>)[key] = value;
  }

  // Common browser globals that should exist
  if (env.window) {
    (globalThis as Record<string, unknown>).HTMLElement = function HTMLElement() {};
    (globalThis as Record<string, unknown>).Element = function Element() {};
    (globalThis as Record<string, unknown>).Node = function Node() {};
    (globalThis as Record<string, unknown>).Event = function Event() {};
    (globalThis as Record<string, unknown>).CustomEvent = function CustomEvent() {};
    (globalThis as Record<string, unknown>).MutationObserver = (
      env.window as Record<string, unknown>
    ).MutationObserver;
    (globalThis as Record<string, unknown>).ResizeObserver = (
      env.window as Record<string, unknown>
    ).ResizeObserver;
  }
}
