import type { SfDecodeOptions } from './SfDecodeOptions';
import type { SfMember } from './SfMember';
import { parseError } from './parse/parseError.ts';
import { parseList } from './parse/parseList.ts';
import { LIST } from './utils/LIST.ts';

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
