import type { SfEncodeOptions } from './SfEncodeOptions.js';
import type { SfMember } from './SfMember.js';
import { serializeList } from './serialize/serializeList.js';

/**
 * Encode a list into a structured field dictionary
 *
 * @param value - The structured field list to encode
 * @param options - Encoding options
 *
 * @returns The structured field string
 *
 * @group Structured Field
 *
 * @beta
 */
export function encodeSfList(value: SfMember[], options?: SfEncodeOptions): string {
	return serializeList(value, options);
}
