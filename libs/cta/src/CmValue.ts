import type { SfItem, SfToken } from '@svta/cml-structured-field-values'

/**
 * A common media value.
 *
 * @internal
 */
export type CmValue =
	| string
	| string[]
	| number
	| number[]
	| boolean
	| symbol
	| SfToken
	| SfItem
	| SfItem[]
