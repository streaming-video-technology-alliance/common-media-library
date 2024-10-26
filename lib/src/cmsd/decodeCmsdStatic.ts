import { symbolToStr } from '../cta/utils/symbolToStr.js';
import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import type { CmsdStatic } from './CmsdStatic.js';

/**
 * Decode a CMSD Static dict string to an object.
 *
 * @param cmsd - The CMSD string to decode.
 *
 * @returns The decoded CMSD object.
 *
 * @group CMSD
 *
 * @beta
 */
export function decodeCmsdStatic(cmsd: string): CmsdStatic {
	if (!cmsd) {
		return {};
	}

	return Object
		.entries(decodeSfDict(cmsd))
		.reduce((acc, [key, item]) => {
			const { value }: any = item;
			acc[key as any] = (typeof value === 'symbol' ? symbolToStr(value) : value) as any;
			return acc;
		}, {} as CmsdStatic);
}
