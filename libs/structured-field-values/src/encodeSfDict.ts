import type { SfEncodeOptions } from './SfEncodeOptions.ts'
import { serializeDict } from './serialize/serializeDict.ts'

/**
 * Encode a structured field dictionary to a string
 *
 * @param value - The structured field dictionary to encode
 * @param options - Encoding options
 *
 * @returns The structured field string
 *
 * @public
 */
export function encodeSfDict(value: Record<string, any> | Map<string, any>, options?: SfEncodeOptions): string {
	return serializeDict(value, options)
}
