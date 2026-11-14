import { defineConfig } from 'vitest/config';
import * as path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'webview'),
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
