import type { Cmcd } from './Cmcd.ts';
import { CmcdHeaderMap } from './CmcdHeaderMap.ts';
import { decodeCmcd } from './decodeCmcd.ts';

const keys = Object.keys(CmcdHeaderMap);

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
 */
export function fromCmcdHeaders(headers: Record<string, string> | Headers): Cmcd {
	if (!(headers instanceof Headers)) {
		headers = new Headers(headers);
	}

	return keys.reduce((acc, key) => {
		const value = (headers as Headers).get(key);
		return Object.assign(acc, decodeCmcd(value as string));
	}, {} as Cmcd);
}
