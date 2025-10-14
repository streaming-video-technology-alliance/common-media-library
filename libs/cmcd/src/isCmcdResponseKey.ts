import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.ts';
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.ts';
import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.ts';
import type { CmcdResponse } from './CmcdResponse.ts';
import { isCmcdCustomKey } from './isCmcdCustomKey.ts';

/**
 * Check if a key is a valid CMCD response key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD request key, `false` otherwise.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/isCmcdResponseKey.test.ts#example}
 */
export function isCmcdResponseKey(key: string): key is keyof CmcdResponse {
	return CMCD_COMMON_KEYS.includes(key as any) ||
		CMCD_REQUEST_KEYS.includes(key as any) ||
		CMCD_RESPONSE_KEYS.includes(key as any) ||
		isCmcdCustomKey(key as any);
}
