import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Node-side tooling at the repo root (vite/postcss/apollo/playwright
    // configs, custom scripts). These run in Node, not the browser, so they
    // need `process`, `__dirname`, etc. Without this, any staged change to
    // one of them fails the pre-commit hook with `no-undef`.
    files: [
      "*.config.{js,cjs,mjs,ts}",
      "get_union_json.ts",
      "scripts/**/*.{js,cjs,mjs,ts}",
    ],
    languageOptions: { globals: globals.node },
    rules: {
      // CommonJS tooling files legitimately use require() (e.g. tailwind plugins).
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
