"use strict";

const js = require("@eslint/js");
const jest = require("eslint-plugin-jest");
const eslintConfigPrettier = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  {
    ignores: [".idea/", "node_modules/"],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      strict: "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
      "no-useless-assignment": "off",
    },
  },
  {
    files: ["test/**/*.js", "**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
  eslintConfigPrettier,
];
