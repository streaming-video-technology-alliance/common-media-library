import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.js';
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.js';
import { isCmcdCustomKey } from './isCmcdCustomKey.js';

/**
 * Check if a key is a valid CMCD request key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD request key, `false` otherwise.
 *
 * @group CMCD
 *
 * @beta
 */
export function isCmcdRequestKey(key: string): boolean {
	return CMCD_COMMON_KEYS.includes(key as any) ||
		CMCD_REQUEST_KEYS.includes(key as any) ||
		isCmcdCustomKey(key as any);
}
