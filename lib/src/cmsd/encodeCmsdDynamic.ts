import { SfItem } from '../structuredfield/SfItem.js';
import { encodeSfList } from '../structuredfield/encodeSfList.js';
import { CmsdDynamic } from './CmsdDynamic.js';

/**
 * Encode a list of CMSD Dynamic objects.
 * 
 * @param value - The list of `SfItems` to encode.
 * 
 * @returns The encoded CMSD string.
 * 
 * @group CMSD
 * 
 * @beta
 */
export function encodeCmsdDynamic(value: SfItem[]): string;

/**
 * Encode a single CMSD Dynamic object.
 * 
 * @param value - The server name
 * @param cmcd - The CMSD object to encode.
 * 
 * @returns The encoded CMSD string.
 * 
 * @group CMSD
 * 
 * @beta
 */
export function encodeCmsdDynamic(value: string, cmsd: CmsdDynamic): string;

export function encodeCmsdDynamic(value: string | SfItem[], cmsd?: CmsdDynamic): string {
	if (!value) {
		return '';
	}

	if (typeof value === 'string') {
		if (!cmsd) {
			return '';
		}

		value = [new SfItem(value, cmsd as any)];
	}

	return encodeSfList(value, { whitespace: false });
}
