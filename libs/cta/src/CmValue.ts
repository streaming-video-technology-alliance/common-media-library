import type { SfItem, SfToken } from '@svta/cml-structured-field-values';
import type { CmObjectType } from './CmObjectType.js';
import type { CmStreamingFormat } from './CmStreamingFormat.js';
import type { CmStreamType } from './CmStreamType.js';

/**
 * A common media value.
 *
 *
 * @beta
 */
export type CmValue =
	| CmObjectType
	| CmStreamingFormat
	| CmStreamType
	| string
	| string[]
	| number
	| number[]
	| boolean
	| symbol
	| SfToken
	| SfItem
	| SfItem[];
