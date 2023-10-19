import { SfItem } from '../structuredfield.js';
import { decodeSfDict } from '../structuredfield/decodeSfDict.js';
import { Cmcd } from './Cmcd.js';
import { symbolToStr } from './symbolToStr.js';

/**
 * Decode a CMCD string to an object.
 * 
 * @param cmcd - The CMCD string to decode.
 * 
 * @returns The decoded CMCD object.
 * 
 * @group CMCD
 */
export function decodeCmcd(cmcd: string): Cmcd {
	if (!cmcd) {
		return {};
	}

	const sfDict = decodeSfDict(decodeURIComponent(cmcd.replace(/^CMCD=/, '')));

	return Object
		.entries<SfItem>(sfDict as any)
		.reduce((acc, [key, item]) => {
			const { value }: any = item;
			// TODO: Find a better way to type this
			acc[key as any] = (typeof value === 'symbol' ? symbolToStr(value) : item.value) as any;
			return acc;
		}, {} as Cmcd);
}
