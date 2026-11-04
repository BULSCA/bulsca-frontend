import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults, coverageConfigDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**', 'scripts/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,vue}'],
        exclude: [...coverageConfigDefaults.exclude, '**/__tests__/**', '**/*.d.ts', 'src/api/generated.ts', 'src/api/public/types.ts', 'src/api/articles/types.ts'],
        reporter: ['text-summary', 'html', 'lcovonly', 'json-summary'],
        reportsDirectory: './coverage',
      },
    },
  }),
)
