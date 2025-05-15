import type { Cmcd } from './Cmcd';

/**
* Type definition for valid CMCD keys.
*/
type CmcdKey = keyof Cmcd;

// Keys supported in CMCD v1 spec
const CMCD_V1_KEYS: Set<CmcdKey> = new Set([
	'br', 'bl', 'bs', 'cid', 'd', 'dl', 'mtp', 'nor', 'nrr',
	'ot', 'pr', 'rtp', 'sf', 'sid', 'st', 'su', 'tb', 'v',
]);

/**
* Type definition for a CMCD key-value object.
*/
type CmcdData = Record<string, string | number | boolean>;

/**
* Converts a CMCD V2 request to a CMCD V1 request
*
* @param cmcdData - The CMCD data object.
*
* @returns Updated list of keys v1 keys.
*
* @group CMCD
*
* @beta
*/
export function convertToCmcdV1(cmcdData: CmcdData): CmcdData {
	const result: CmcdData = {};
	for (const key in cmcdData) {
		if (CMCD_V1_KEYS.has(key as CmcdKey)) {
			result[key as CmcdKey] = cmcdData[key as CmcdKey];
		}
	}
	return result;
}
