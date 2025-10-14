import { encodeSfDict } from '@svta/cml-structured-field-values';
import type { CmsdEncodeOptions } from './CmsdEncodeOptions.ts';
import type { CmsdStatic } from './CmsdStatic.ts';
import { processCmsd } from './utils/processCmsd.ts';

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
