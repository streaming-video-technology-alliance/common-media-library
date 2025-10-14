import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.ts';
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.ts';
import type { CmcdRequest } from './CmcdRequest.ts';
import { isCmcdCustomKey } from './isCmcdCustomKey.ts';

/**
 * Check if a key is a valid CMCD request key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD request key, `false` otherwise.
 *
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/isCmcdRequestKey.test.ts#example}
 */
export function isCmcdRequestKey(key: string): key is keyof CmcdRequest {
	return CMCD_COMMON_KEYS.includes(key as any) ||
		CMCD_REQUEST_KEYS.includes(key as any) ||
		isCmcdCustomKey(key as any);
}
