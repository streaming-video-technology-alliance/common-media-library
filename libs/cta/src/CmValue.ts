import type { SfItem } from '@svta/cml-structuredfield/SfItem.js';
import type { SfToken } from '@svta/cml-structuredfield/SfToken.js';
import type { CmObjectType } from './CmObjectType.js';
import type { CmStreamingFormat } from './CmStreamingFormat.js';
import type { CmStreamType } from './CmStreamType.js';

/**
 * A common media value.
 *
 * @group CTA
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
