import { SfDictionary } from './SfDictionary.js';
import { serializeDict } from './serializeDict.js';

export function encodeSfDict(value: SfDictionary) {
	return serializeDict(value);
}
