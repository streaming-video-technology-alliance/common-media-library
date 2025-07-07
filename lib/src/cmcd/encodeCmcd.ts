import { encodeSfDict } from '../structuredfield/encodeSfDict.js';
import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { prepareCmcdData } from './prepareCmcdData.js';

/**
 * Encode a CMCD object to a string.
 *
 * @param cmcd - The CMCD object to encode.
 * @param options - Options for encoding.
 *
 * @returns The encoded CMCD string.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/cmcd/encodeCmcd.test.ts#example}
 */
export function encodeCmcd(cmcd: CmcdData, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	return encodeSfDict(prepareCmcdData(cmcd, options), { whitespace: false });
}
