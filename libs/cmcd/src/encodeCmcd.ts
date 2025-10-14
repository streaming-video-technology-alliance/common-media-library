import { encodeSfDict } from '@svta/cml-structured-field-values';
import type { CmcdData } from './CmcdData.ts';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts';
import { prepareCmcdData } from './prepareCmcdData.ts';

/**
 * Encode a CMCD object to a string.
 *
 * @param cmcd - The CMCD object to encode.
 * @param options - Options for encoding.
 *
 * @returns The encoded CMCD string.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/encodeCmcd.test.ts#example}
 */
export function encodeCmcd(cmcd: CmcdData, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	return encodeSfDict(prepareCmcdData(cmcd, options), { whitespace: false });
}
