import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import { CmsdStatic } from './CmsdStatic.js';

/**
 * Decode a CMSD Static dict string to an object.
 * 
 * @param cmcd - The CMSD string to decode.
 * 
 * @returns The decoded CMSD object.
 * 
 * @group CMSD
 */
export function decodeCmsdStatic(cmsd: string): CmsdStatic {
	if (!cmsd) {
		return {};
	}

	const sfDict = decodeSfDict(cmsd);

	return sfDict as any;
}
