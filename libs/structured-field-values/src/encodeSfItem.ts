import type { SfBareItem } from './SfBareItem.ts'
import { SfItem } from './SfItem.ts'
import type { SfParameters } from './SfParameters.ts'
import { serializeBareItem } from './serialize/serializeBareItem.ts'
import { serializeItem } from './serialize/serializeItem.ts'
import { serializeParams } from './serialize/serializeParams.ts'

/**
 * Encode a structured field item to a string
 *
 * @param value - The structured field item to encode
 *
 * @returns The structured field string
 *
 * @public
 */
export function encodeSfItem(value: SfItem): string;

/**
 * Encode a structured field value to a string with optional parameters.
 *
 * @param value - The structured field value to encode
 * @param params - The structured field parameters
 *
 * @returns The structured field string
 *
 * @public
 */
export function encodeSfItem(value: SfBareItem, params?: SfParameters): string;

export function encodeSfItem(value: SfItem | SfBareItem, params?: SfParameters): string {
	if (value instanceof SfItem) {
		return serializeItem(value)
	}

	return `${serializeBareItem(value)}${serializeParams(params)}`
}
