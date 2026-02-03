import type { SfItem, SfToken } from '@svta/cml-structured-field-values'

/**
 * A value type for custom CMCD keys.
 *
 * @public
 */
export type CmcdCustomValue =
	| string
	| SfItem<string>
	| (string | SfItem<string>)[]
	| number
	| SfItem<number>
	| (number | SfItem<number>)[]
	| boolean
	| SfItem<boolean>
	| (boolean | SfItem<boolean>)[]
	| symbol
	| SfItem<symbol>
	| (symbol | SfItem<symbol>)[]
	| SfToken
	| SfItem<SfToken>
	| (SfToken | SfItem<SfToken>)[];
