import { decodeSfDict } from '@svta/cml-structured-field-values/decodeSfDict.js';
import { symbolToStr } from '@svta/cml-structured-field-values/utils/symbolToStr.js';
import type { CmsdStatic } from './CmsdStatic.js';

/**
 * Decode a CMSD Static dict string to an object.
 *
 * @param cmsd - The CMSD string to decode.
 *
 * @returns The decoded CMSD object.
 *
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
