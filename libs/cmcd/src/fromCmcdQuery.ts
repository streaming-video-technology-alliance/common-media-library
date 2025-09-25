import type { Cmcd } from './Cmcd.js';
import { CMCD_PARAM } from './CMCD_PARAM.js';
import { decodeCmcd } from './decodeCmcd.js';

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
 *
 * @example
 * {@includeCode ../test/fromCmcdQuery.test.ts#example}
 */
export function fromCmcdQuery(query: string | URLSearchParams): Cmcd {
	if (typeof query === 'string') {
		query = new URLSearchParams(query);
	}

	const value = query.get(CMCD_PARAM);

	return decodeCmcd(value as string);
}
