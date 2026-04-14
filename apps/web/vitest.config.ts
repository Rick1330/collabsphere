import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(rootDir, "src") },
      {
        find: /^@collabsphere\/ui$/,
        replacement: path.resolve(rootDir, "../../packages/ui/src/index.ts"),
      },
      {
        find: /^@collabsphere\/ui\/components\/(.*)$/,
        replacement: path.resolve(rootDir, "../../packages/ui/src/components/$1.tsx"),
      },
      {
        find: /^@collabsphere\/ui\/lib\/(.*)$/,
        replacement: path.resolve(rootDir, "../../packages/ui/src/lib/$1.ts"),
      },
      {
        find: /^@collabsphere\/shared$/,
        replacement: path.resolve(rootDir, "../../packages/shared/src/index.ts"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["./src/**/*.test.{ts,tsx}"],
    css: true,
  },
});
