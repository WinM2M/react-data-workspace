import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./jest.setup.ts"],
    include: ["src/__tests__/**/*.vitest.ts?(x)"]
  }
});
