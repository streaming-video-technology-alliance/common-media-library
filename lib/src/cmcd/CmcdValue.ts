import type { SfItem } from '../structuredfield/SfItem.js';
import type { SfToken } from '../structuredfield/SfToken.js';
import type { CmcdObjectType } from './CmcdObjectType.js';
import type { CmcdStreamType } from './CmcdStreamType.js';
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.js';

/**
 * CMCD Value
 *
 * @group CMCD
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
