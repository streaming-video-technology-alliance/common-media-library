import type { SfDecodeOptions } from './SfDecodeOptions';
import type { SfDictionary } from './SfDictionary';
import { parseDict } from './parse/parseDict.ts';
import { parseError } from './parse/parseError.ts';
import { DICT } from './utils/DICT.ts';

/**
 * Decode a structured field string into a structured field dictionary
 *
 * @param input - The structured field string to decode
 * @returns The structured field dictionary
 *
 * @group Structured Field
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
