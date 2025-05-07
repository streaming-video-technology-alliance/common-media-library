import type { SfEncodeOptions } from './SfEncodeOptions.ts';
import { serializeDict } from './serialize/serializeDict.ts';

/**
 * Encode an object into a structured field dictionary
 *
 * @param value - The structured field dictionary to encode
 * @param options - Encoding options
 *
 * @returns The structured field string
 *
 * @group Structured Field
 *
 * @beta
 */
export function encodeSfDict(value: Record<string, any> | Map<string, any>, options?: SfEncodeOptions): string {
	return serializeDict(value, options);
}
