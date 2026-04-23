import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const useSingleWorker = process.platform === "win32" && !process.env.CI;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup/index.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    poolOptions: useSingleWorker
      ? {
          forks: {
            maxForks: 1,
            minForks: 1,
          },
        }
      : undefined,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
