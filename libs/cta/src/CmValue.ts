import type { SfItem } from '@svta/cml-structured-field-values/SfItem.js';
import type { SfToken } from '@svta/cml-structured-field-values/SfToken.js';
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
