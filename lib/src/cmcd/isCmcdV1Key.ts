import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.js';
import type { Cmcd } from './Cmcd.js';
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
 *
 * @example
 * {@includeCode ../../test/cmcd/isCmcdV1Key.test.ts#example}
 */
export function isCmcdV1Key(key: string): key is keyof Cmcd {
	return CMCD_V1_KEYS.includes(key as any) || isCmcdCustomKey(key as any);
}
