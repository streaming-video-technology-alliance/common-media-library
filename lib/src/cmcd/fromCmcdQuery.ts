import type { Cmcd } from './Cmcd';
import { CMCD_PARAM } from './CMCD_PARAM.ts';
import { decodeCmcd } from './decodeCmcd.ts';

/**
 * Decode CMCD data from a query string.
 *
 * @param query - The query string to decode.
 *
 * @returns The decoded CMCD data.
 *
 * @group CMCD
 *
 * @beta
 */
export function fromCmcdQuery(query: string | URLSearchParams): Cmcd {
	if (typeof query === 'string') {
		query = new URLSearchParams(query);
	}

	const value = query.get(CMCD_PARAM);

	return decodeCmcd(value as string);
}
