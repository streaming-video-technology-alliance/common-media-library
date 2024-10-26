import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsdoc from 'eslint-plugin-tsdoc';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [{
	ignores: ['**/dist'],
}, ...compat.extends(
	'eslint:recommended',
	'plugin:@typescript-eslint/recommended',
), {
	plugins: {
		'@typescript-eslint': typescriptEslint,
		tsdoc,
	},

	files: ['**/*.js', '**/*.ts'],

	languageOptions: {
		globals: {
			...globals.browser,
			...globals.node,
		},

		parser: tsParser,
	},

	rules: {
		'@typescript-eslint/consistent-type-imports': 'error',
		'@typescript-eslint/no-empty-interface': 'error',
		'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
		'@typescript-eslint/no-duplicate-enum-values': 'off',
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'no-unused-vars': 'off',
		'no-case-declarations': 'off',
		'no-fallthrough': 'off',
		semi: ['error', 'always'],

		indent: ['error', 'tab', {
			SwitchCase: 1,
			MemberExpression: 1,

			ignoredNodes: [
				'FunctionExpression > .params[decorators.length > 0]',
				'FunctionExpression > .params > :matches(Decorator,:not(:first-child))',
				'ClassBody.body > PropertyDefinition[decorators.length > 0] > .key',
			],
		}],

		'space-infix-ops': ['error'],
		'key-spacing': ['error'],
		'eol-last': ['error', 'always'],
		'comma-dangle': ['error', 'always-multiline'],

		quotes: ['error', 'single', {
			allowTemplateLiterals: true,
			avoidEscape: true,
		}],

		'keyword-spacing': ['error', {
			after: true,
		}],

		curly: ['error'],
		'object-curly-spacing': ['error', 'always'],

		'brace-style': ['error', 'stroustrup', {
			allowSingleLine: false,
		}],

		'tsdoc/syntax': 'warn',
	},
}];
