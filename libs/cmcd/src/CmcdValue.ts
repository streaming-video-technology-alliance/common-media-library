import type { SfItem, SfToken } from '@svta/cml-structured-field-values';
import type { CmcdObjectType } from './CmcdObjectType.js';
import type { CmcdStreamType } from './CmcdStreamType.js';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.js';

/**
 * CMCD Value
 *
 *
 * @beta
 */
export type CmcdValue =
	| CmcdObjectType
	| CmcdStreamingFormat
	| CmcdStreamType
	| string
	| string[]
	| number
	| number[]
	| boolean
	| symbol
	| SfToken
	| SfItem
	| SfItem[];
