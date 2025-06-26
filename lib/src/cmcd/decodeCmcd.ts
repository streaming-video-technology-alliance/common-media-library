import { symbolToStr } from '../cta/utils/symbolToStr.js';
import type { SfItem } from '../structuredfield/SfItem.js';
import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import type { CmcdData } from './CmcdData.js';

/**
 * Decode a CMCD string to an object.
 *
 * @param cmcd - The CMCD string to decode.
 *
 * @returns The decoded CMCD object.
 *
 * @group CMCD
 *
 * @beta
 */
export function decodeCmcd<T extends CmcdData = CmcdData>(cmcd: string): T {
	if (!cmcd) {
		return {} as T;
	}

	const sfDict = decodeSfDict(decodeURIComponent(cmcd.replace(/^CMCD=/, '')));

	return Object
		.entries<SfItem>(sfDict as any)
		.reduce((acc, [key, item]) => {
			const { value }: any = item;
			// TODO: Find a better way to type this`
			acc[key as keyof T] = (typeof value === 'symbol' ? symbolToStr(value) : item.value) as T[keyof T];
			return acc;
		}, {} as T);
}
