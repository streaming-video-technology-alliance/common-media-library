import { encodeSfDict } from '../structuredfield/encodeSfDict.ts';
import type { Cmcd } from './Cmcd';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions';
import { processCmcd } from './utils/processCmcd.ts';

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
 */
export function encodeCmcd(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	return encodeSfDict(processCmcd(cmcd, options), Object.assign({ whitespace: false }, options));
}
