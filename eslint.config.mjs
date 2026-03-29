import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      ".turbo/**",
      "coverage/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: [
      "apps/**/*.js",
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
      "packages/**/*.ts",
    ],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];
