import type { SfEncodeOptions } from './SfEncodeOptions.ts'
import type { SfMember } from './SfMember.ts'
import { serializeList } from './serialize/serializeList.ts'

/**
 * Encode a structured field list to a string
 *
 * @param value - The structured field list to encode
 * @param options - Encoding options
 *
 * @returns The structured field string
 *
 * @public
 */
export function encodeSfList(value: SfMember[], options?: SfEncodeOptions): string {
	return serializeList(value, options)
}
