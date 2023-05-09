import { Cmcd } from './Cmcd.js';
import { CmcdHeaderMap } from './CmcdHeaderMap.js';
import { decodeCmcd } from './decodeCmcd.js';

/**
 * Decode CMCD data from request headers.
 * 
 * @param headers - The request headers to decode.
 * 
 * @returns The decoded CMCD data.
 * 
 * @group CMCD
 */
export function fromCmcdHeaders(headers: Record<string, string> | Headers): Cmcd {
	const keys = Object.keys(CmcdHeaderMap);

	if (!(headers instanceof Headers)) {
		headers = new Headers(headers);
	}
  
	return keys.reduce((acc, key) => {
		const value = (headers as Headers).get(key);
		return Object.assign(acc, decodeCmcd(value as string));
	}, {} as Cmcd);
}
