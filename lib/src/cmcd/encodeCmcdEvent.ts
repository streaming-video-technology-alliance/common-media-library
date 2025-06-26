import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';
import { isCmcdEventKey } from './isCmcdEventKey.js';

/**
 * Encode a CMCD object to a string to be used in event mode.
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
export function encodeCmcdEvent(cmcd: CmcdData, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	const filter = options.filter ?? (() => true);

	return encodeCmcd(cmcd, {
		...options,
		filter: (key) => isCmcdEventKey(key) && filter(key),
	});
}
