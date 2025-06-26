import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.js';
import { isCmcdCustomKey } from './isCmcdCustomKey.js';

/**
 * Filter function for CMCD v1 keys.
 *
 * @param key - The CMCD key to filter.
 *
 * @returns `true` if the key should be included, `false` otherwise.
 *
 * @group CMCD
 *
 * @beta
 */
export function isCmcdV1Key(key: string): boolean {
	return CMCD_V1_KEYS.includes(key as any) || isCmcdCustomKey(key as any);
}
