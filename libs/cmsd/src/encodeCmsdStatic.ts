import { encodeSfDict } from '@svta/cml-structuredfield/encodeSfDict.js';
import type { CmsdEncodeOptions } from './CmsdEncodeOptions.js';
import type { CmsdStatic } from './CmsdStatic.js';
import { processCmsd } from './utils/processCmsd.js';

/**
 * Encode a CMSD Static object.
 *
 * @param cmsd - The CMSD object to encode.
 * @param options - Encoding options
 *
 * @returns The encoded CMSD string.
 *
 *
 * @beta
 */
export function encodeCmsdStatic(cmsd: CmsdStatic, options?: CmsdEncodeOptions): string {
	if (!cmsd) {
		return '';
	}

	return encodeSfDict(processCmsd(cmsd, options), { whitespace: false });
}
