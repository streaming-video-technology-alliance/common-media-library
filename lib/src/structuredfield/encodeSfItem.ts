import { SfBareItem } from './SfBareItem.js';
import { SfItem } from './SfItem.js';
import { SfParameters } from './SfParameters.js';
import { serializeItem } from './serialize/serializeItem.js';

/**
 * Encode an item into a structured field dictionary
 * 
 * @param input - The structured field item to encode
 * @returns The structured field string
 * 
 * @group Structured Field
 */
export function encodeSfItem(value: SfItem): string;
export function encodeSfItem(value: SfBareItem, params?: SfParameters): string;
export function encodeSfItem(value: SfItem | SfBareItem, params?: SfParameters) {
	if (!(value instanceof SfItem)) {
		value = new SfItem(value, params);
	}

	return serializeItem(value);
}
