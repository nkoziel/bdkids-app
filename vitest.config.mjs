import { defineConfig } from 'vitest/config';

/* core/state.js reads localStorage at import time, so tests need a DOM. happy-dom is enough. */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
  },
});
