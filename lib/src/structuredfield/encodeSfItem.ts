import { SfBareItem } from './SfBareItem.js';
import { SfItem } from './SfItem.js';
import { serializeItem } from './serializeItem.js';

export function encodeSfItem(value: SfItem | SfBareItem) {
	return serializeItem(value);
}
