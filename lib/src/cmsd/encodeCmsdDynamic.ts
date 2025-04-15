import { SfItem } from '../structuredfield/SfItem.ts';
import { encodeSfList } from '../structuredfield/encodeSfList.ts';
import type { CmsdDynamic } from './CmsdDynamic.ts';

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
 * @param cmsd - The CMSD object to encode.
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
