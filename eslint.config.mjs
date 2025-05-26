import eslintPlugin from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    name: 'my-custom-eslint-config',
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      // 여기에 룰 추가
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
