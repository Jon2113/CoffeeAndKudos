import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'vmForks',
    poolOptions: {
      vmForks: {
        isolate: false,
      },
    },
  },
});
