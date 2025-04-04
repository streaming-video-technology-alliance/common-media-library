import type { SfDecodeOptions } from './SfDecodeOptions.js';
import type { SfMember } from './SfMember.js';
import { parseError } from './parse/parseError.js';
import { parseList } from './parse/parseList.js';
import { LIST } from './utils/LIST.js';

/**
 * Decode a structured field string into a structured field list
 *
 * @param input - The structured field string to decode
 * @returns The structured field list
 *
 * @group Structured Field
 *
 * @beta
 */
export function decodeSfList(input: string, options?: SfDecodeOptions): SfMember[] {
	try {
		const { src, value } = parseList(input.trim(), options);
		if (src !== '') {
			throw parseError(src, LIST);
		}
		return value;
	}
	catch (cause) {
		throw parseError(input, LIST, cause);
	}
}
