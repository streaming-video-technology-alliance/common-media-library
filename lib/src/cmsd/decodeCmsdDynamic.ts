import { decodeSfList } from '../structuredfield/decodeSfList.js';
import { CmsdDynamic } from './CmsdDynamic.js';

/**
 * Decode a CMSD dynamic string to an object.
 *
 * @param cmcd - The CMSD string to decode.
 *
 * @returns The decoded CMSD object.
 *
 * @group CMSD
 *
 * @beta
 */
export function decodeCmsdDynamic(cmsd: string): CmsdDynamic[] {
	if (!cmsd) {
		return [];
	}

	const sfDict = decodeSfList(cmsd);

	return sfDict as CmsdDynamic[];
}
