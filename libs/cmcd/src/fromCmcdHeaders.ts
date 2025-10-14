import { CMCD_OBJECT } from './CMCD_OBJECT.ts';
import { CMCD_REQUEST } from './CMCD_REQUEST.ts';
import { CMCD_SESSION } from './CMCD_SESSION.ts';
import { CMCD_STATUS } from './CMCD_STATUS.ts';
import type { CmcdData } from './CmcdData.ts';
import { decodeCmcd } from './decodeCmcd.ts';

const keys = [CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS];

/**
 * Decode CMCD data from request headers.
 *
 * @param headers - The request headers to decode.
 *
 * @returns The decoded CMCD data.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/fromCmcdHeaders.test.ts#example}
 */
export function fromCmcdHeaders(headers: Record<string, string> | Headers): CmcdData {
	if (!(headers instanceof Headers)) {
		headers = new Headers(headers);
	}

	return keys.reduce((acc, key) => {
		const value = headers.get(key);
		return Object.assign(acc, decodeCmcd(value as string));
	}, {} as CmcdData);
}
