import type { SfItem, SfToken } from '@svta/cml-structured-field-values';
import type { CmcdObjectType } from './CmcdObjectType.ts';
import type { CmcdStreamType } from './CmcdStreamType.ts';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts';

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
