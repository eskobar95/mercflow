import path from "node:path"
import { fileURLToPath } from "node:url"

import eslint from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const monorepoRoot = __dirname

export default tseslint.config(
  {
    name: "mercflow/global-ignores",
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "packages/admin-ui/dist/**",
      "packages/design-tokens/dist/**",
      "packages/content-module/**/migrations/**",
      "packages/connector-module/**/migrations/**",
      "packages/feed-module/**/migrations/**",
      // Medusa build output (generated; not hand-authored TS)
      "**/.medusa/**",
      // Not part of the default TS project; Vitest config is tooling-only
      "**/vitest.config.ts",
    ],
  },
  eslint.configs.recommended,
  {
    name: "mercflow/typescript",
    files: [
      "packages/**/*.ts",
      "packages/**/*.tsx",
      "apps/**/*.ts",
    ],
    ignores: [
      "packages/content-module/**/migrations/**",
      "packages/connector-module/**/migrations/**",
      "packages/feed-module/**/migrations/**",
      // Linted in `mercflow/design-tokens-test` without the TS project service
      "packages/design-tokens/test/**",
    ],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: monorepoRoot,
      },
    },
  },
  {
    name: "mercflow/design-tokens-test",
    files: ["packages/design-tokens/test/**/*.ts"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        // `packages/design-tokens/tsconfig.json` only includes `src/**`; tests use
        // `tsconfig.test.json` so the parser must resolve a project that includes them.
        project: ["packages/design-tokens/tsconfig.test.json"],
        tsconfigRootDir: monorepoRoot,
      },
    },
  },
  {
    name: "mercflow/react-hooks",
    files: [
      "packages/admin-ui/src/**/*.ts",
      "packages/admin-ui/src/**/*.tsx",
      "packages/admin-ui/test/**/*.ts",
      "packages/admin-ui/test/**/*.tsx",
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    name: "mercflow/react-refresh",
    files: [
      "packages/admin-ui/src/**/*.tsx",
      "packages/admin-ui/test/**/*.tsx",
    ],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
)
