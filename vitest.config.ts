import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // The full jsdom suite exceeds worker resources when files run in
    // parallel, causing nondeterministic timeouts. Keep CI and local results
    // deterministic; individual tests still exercise their async behavior.
    fileParallelism: false,
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    css: true,
  },
});
