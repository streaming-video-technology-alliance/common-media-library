import type { SfDecodeOptions } from './SfDecodeOptions.js';
import type { SfDictionary } from './SfDictionary.js';
import { parseDict } from './parse/parseDict.js';
import { parseError } from './parse/parseError.js';
import { DICT } from './utils/DICT.js';

/**
 * Decode a structured field string into a structured field dictionary
 *
 * @param input - The structured field string to decode
 * @returns The structured field dictionary
 *
 *
 * @beta
 */
export function decodeSfDict(input: string, options?: SfDecodeOptions): SfDictionary {
	try {
		const { src, value } = parseDict(input.trim(), options);
		if (src !== '') {
			throw parseError(src, DICT);
		}
		return value;
	}
	catch (cause) {
		throw parseError(input, DICT, cause);
	}
}
