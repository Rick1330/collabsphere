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
        find: "@collabsphere/ui/components/dialog",
        replacement: path.resolve(rootDir, "../../packages/ui/src/components/dialog.tsx"),
      },
      {
        find: "@collabsphere/ui/components/dropdown-menu",
        replacement: path.resolve(rootDir, "../../packages/ui/src/components/dropdown-menu.tsx"),
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
