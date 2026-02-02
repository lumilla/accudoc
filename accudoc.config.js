// accudoc.config.js
import { defineConfig } from './dist/index.js';

export default defineConfig({
  docs: './',
  include: ['README.md'],
  imports: {
    'accudoc': './dist/index.js',
    'accudoc/vitepress': './dist/vitepress.js',
  },
});
