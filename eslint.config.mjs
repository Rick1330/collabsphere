import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

// Intentionally kept as .mjs because ESLint's flat-config entrypoint is native ESM.
// Switching this file to TypeScript would require loader/bootstrap coupling for lint.
export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      ".turbo/**",
      "coverage/**",
    ],
  },
  {
    files: [
      "apps/**/src/**/*.js",
    ],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "Use TypeScript for app entrypoints. JavaScript files under apps/*/src are not allowed.",
        },
      ],
    },
  },
  {
    ...js.configs.recommended,
    files: [
      "apps/**/*.js",
      "apps/**/*.mjs",
      "scripts/**/*.mjs",
      "tests/**/*.mjs",
    ],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ...js.configs.recommended,
    files: [
      ".github/scripts/**/*.js",
    ],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ...js.configs.recommended,
    files: [
      "apps/**/*.ts",
      "apps/**/*.tsx",
      "packages/**/*.ts",
      "tests/**/*.ts",
      ".github/scripts/**/*.ts",
    ],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: [
      "apps/web/**/*.ts",
      "apps/web/**/*.tsx",
    ],
    settings: {
      next: {
        rootDir: "apps/web",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
