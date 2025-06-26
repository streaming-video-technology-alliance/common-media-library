import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { encodeCmcd } from './encodeCmcd.js';
import { isCmcdRequestKey } from './isCmcdRequestKey.js';

/**
 * Encode a CMCD object to a string to be used in request mode.
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
export function encodeCmcdRequest(cmcd: CmcdData, options: CmcdEncodeOptions = {}): string {
	if (!cmcd) {
		return '';
	}

	const filter = options.filter ?? (() => true);

	return encodeCmcd(cmcd, {
		...options,
		filter: (key) => {
			console.log(key, isCmcdRequestKey(key));
			return isCmcdRequestKey(key) && filter(key);
		},
	});
}
