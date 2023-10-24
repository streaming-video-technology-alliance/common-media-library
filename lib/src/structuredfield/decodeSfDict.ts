import { SfDecodeOptions } from './SfDecodeOptions.js';
import { parseDict } from './parse/parseDict.js';
import { parseError } from './parse/parseError.js';
import { DICT } from './utils/DICT.js';

/**
 * Decode a structured field string into a structured field dictionary
 * 
 * @param input - The structured field string to decode
 * @returns The structured field dictionary
 * 
 * @group Structured Field
 */
export function decodeSfDict(input: string, options?: SfDecodeOptions) {
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
