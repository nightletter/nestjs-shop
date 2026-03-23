// @ts-check
import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  ...compat.extends('airbnb-base', 'airbnb-typescript/base'),
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'import/prefer-default-export': 'off',
      'import/no-cycle': 'off',
      'max-classes-per-file': 'off',
      'class-methods-use-this': 'off',
      'no-underscore-dangle': 'off',
      'no-void': 'off',
      'prefer-destructuring': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
);
