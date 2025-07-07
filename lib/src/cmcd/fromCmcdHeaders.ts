import { CMCD_OBJECT } from './CMCD_OBJECT.js';
import { CMCD_REQUEST } from './CMCD_REQUEST.js';
import { CMCD_SESSION } from './CMCD_SESSION.js';
import { CMCD_STATUS } from './CMCD_STATUS.js';
import type { CmcdData } from './CmcdData.js';
import { decodeCmcd } from './decodeCmcd.js';

const keys = [CMCD_OBJECT, CMCD_REQUEST, CMCD_SESSION, CMCD_STATUS];

/**
 * Decode CMCD data from request headers.
 *
 * @param headers - The request headers to decode.
 *
 * @returns The decoded CMCD data.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/cmcd/fromCmcdHeaders.test.ts#example}
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
