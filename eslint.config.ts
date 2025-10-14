import eslint from '@eslint/js'
import type { Linter } from 'eslint'
import tsdoc from 'eslint-plugin-tsdoc'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

const config: Linter.Config[] = defineConfig(
	eslint.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.stylistic,
	{
		ignores: ['**/dist'],
	},
	{
		plugins: {
			tsdoc,
		},
	},
	{
		rules: {
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none', ignoreRestSiblings: true }],
			'no-case-declarations': 'off',
			'semi': ['error', 'never'],
			'quotes': ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],

			// TODO: Remove these
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	}
)

export default config
