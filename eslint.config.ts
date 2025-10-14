import eslint from '@eslint/js';
import tsdoc from 'eslint-plugin-tsdoc';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const config = defineConfig(
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
			"@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }],
			'no-case-declarations': 'off',
		},
	}
)

export default config


// /*
// import { default as stylistic } from '@stylistic/eslint-plugin';
// import typescriptEslint from '@typescript-eslint/eslint-plugin';
// import tsParser from '@typescript-eslint/parser';
// import tsdoc from 'eslint-plugin-tsdoc';
// import globals from 'globals';

// export default [
// 	{
// 		ignores: ['**dist'],
// 	},
// {
// 	plugins: {
// 		'@stylistic': stylistic,
// 			'@typescript-eslint': typescriptEslint,
// 				tsdoc,
// 		},

// 	files: ['***.js', '***.ts'],

// 		languageOptions: {
// 		globals: {
// 				...globals.browser,
// 				...globals.node,
// 			},
// 		parser: tsParser,
// 		},

// 	rules: {
// 		'@typescript-eslint/consistent-type-imports': 'error',
// 			'@typescript-eslint/no-empty-interface': 'error',
// 				'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
// 					'@stylistic/no-duplicate-enum-values': 'off',
// 						'@stylistic/no-use-before-define': 'off',
// 							'@stylistic/no-unused-vars': 'off',
// 								'@stylistic/no-explicit-any': 'off',
// 									'@stylistic/ban-ts-comment': 'off',
// 										'@stylistic/no-inferrable-types': 'off',
// 											'@stylistic/no-empty-function': 'off',
// 												'@stylistic/no-unused-vars': 'off',
// 													'@stylistic/no-case-declarations': 'off',
// 														'@stylistic/no-fallthrough': 'off',
// 															'@stylistic/space-infix-ops': ['error'],
// 																'@stylistic/key-spacing': ['error'],
// 																	'@stylistic/eol-last': ['error', 'always'],
// 																		'@stylistic/comma-dangle': ['error', 'always-multiline'],
// 																			'@stylistic/semi': ['error', 'always'],
// 																				'@stylistic/indent': ['error', 'tab', {
// 																					SwitchCase: 1,
// 																					MemberExpression: 1,
// 																				}],
// 																					'@stylistic/quotes': ['error', 'single', {
// 																						allowTemplateLiterals: true,
// 																						avoidEscape: true,
// 																					}],
// 																						'@stylistic/keyword-spacing': ['error', {
// 																							after: true,
// 																						}],
// 																							'@/curly': ['error'],
// 																								'@stylistic/object-curly-spacing': ['error', 'always'],
// 																									'@stylistic/brace-style': ['error', 'stroustrup', {
// 																										allowSingleLine: false,
// 																									}],
// 																										'tsdoc/syntax': 'warn',
// 																											"func-style": ["error", "declaration", {
// 																												"allowArrowFunctions": true,
// 																												"overrides": { "namedExports": "declaration" }
// 																											}]
// 	},
// }];

// */
