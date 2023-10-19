import { encodeSfDict } from '../structuredfield/encodeSfDict.js';
import { CmsdStatic } from './CmsdStatic.js';

/**
 * Encode a CMSD Static object.
 * 
 * @param cmcd - The CMSD object to encode.
 * 
 * @returns The encoded CMSD string.
 * 
 * @group CMSD
 */
export function encodeCmsdStatic(cmsd: CmsdStatic): string {
	if (!cmsd) {
		return '';
	}

	return encodeSfDict(cmsd);
}
