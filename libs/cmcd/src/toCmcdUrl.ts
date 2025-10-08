import type { Cmcd } from './Cmcd.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';

/**
 * Convert a CMCD data object to a URL encoded string.
 *
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The URL encoded CMCD data.
 *
 *
 * @beta
 */
export function toCmcdUrl(cmcd: Cmcd, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	const params = encodeCmcd(cmcd, options);

	return encodeURIComponent(params);
}
