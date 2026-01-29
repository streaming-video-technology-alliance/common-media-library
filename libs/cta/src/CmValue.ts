import type { SfItem, SfToken } from '@svta/cml-structured-field-values'
import type { ValueOrArray } from '@svta/cml-utils'
import type { CmObjectType } from './CmObjectType.ts'
import type { CmStreamingFormat } from './CmStreamingFormat.ts'
import type { CmStreamType } from './CmStreamType.ts'

/**
 * A common media value.
 *
 * @public
 */
export type CmValue =
	| CmObjectType
	| CmStreamingFormat
	| CmStreamType
	| ValueOrArray<string | SfItem<string>>
	| string
	| string[]
	| number
	| number[]
	| boolean
	| symbol
	| SfToken
	| SfItem
	| SfItem[]
	| (number | SfItem)[];
