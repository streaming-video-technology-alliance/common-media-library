import type { SfItem, SfToken } from '@svta/cml-structured-field-values'
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
	| string
	| (string | SfItem<string>)[]
	| number
	| (number | SfItem<number>)[]
	| boolean
	| symbol
	| SfToken
	| SfItem
	| SfItem[];
