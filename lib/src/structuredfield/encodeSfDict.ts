import { SfEncodeOptions } from './SfEncodeOptions.js';
import { serializeDict } from './serialize/serializeDict.js';

/**
 * Encode an object into a structured field dictionary
 * 
 * @param input - The structured field dictionary to encode
 * @returns The structured field string
 * 
 * @group Structured Field
 */
export function encodeSfDict(value: Record<string, any> | Map<string, any>, options?: SfEncodeOptions) {
	return serializeDict(value, options);
}
