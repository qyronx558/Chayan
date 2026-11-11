import path from "node:path"
import { defineConfig } from "vitest/config"

// Minimum coverage every PR must keep. Raise these as more tests land.
const COVERAGE_THRESHOLD = 35

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    testTimeout: 15_000,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      // Business logic lives in src/lib (plus middleware). UI components are
      // covered by the Playwright scripts in tests/e2e, not by this gate.
      include: ["src/lib/**/*.ts", "middleware.ts"],
      exclude: [
        "src/lib/**/*.d.ts",
        "src/lib/**/types.ts",
        "src/lib/search-types.ts",
        "src/lib/analytics/types.ts",
        // React hooks / browser-only helpers - need a DOM, not part of the gate
        "src/lib/admin/usePageSize.ts",
        "src/lib/bulk-upload/client.ts",
        "src/lib/download-pdf.ts",
      ],
      thresholds: {
        lines: COVERAGE_THRESHOLD,
        statements: COVERAGE_THRESHOLD,
        functions: COVERAGE_THRESHOLD,
        branches: COVERAGE_THRESHOLD,
      },
    },
  },
})
