import { SfEncodeOptions } from './SfEncodeOptions.js';
import { SfMember } from './SfMember.js';
import { serializeList } from './serializeList.js';

/**
 * Encode a list into a structured field dictionary
 * 
 * @param input - The structured field list to encode
 * @returns The structured field string
 * 
 * @group Structured Field
 */
export function encodeSfList(value: SfMember[], options?: SfEncodeOptions) {
	return serializeList(value, options);
}
