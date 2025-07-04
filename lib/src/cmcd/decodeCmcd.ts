import { symbolToStr } from '../cta/utils/symbolToStr.js';
import { SfItem } from '../structuredfield/SfItem.js';
import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import type { CmcdData } from './CmcdData.js';

// TODO: Find a way to type this properly
const reduceValue = (value: any): any => {
	if (Array.isArray(value)) {
		return value.map(reduceValue);
	}

	if (typeof value === 'symbol') {
		return symbolToStr(value);
	}

	if (value instanceof SfItem && !value.params) {
		return value.value;
	}

	return value;
};

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
			acc[key as keyof T] = reduceValue(item.value);
			return acc;
		}, {} as T);
}
