import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.js';
import { CMCD_EVENT_KEYS } from './CMCD_EVENT_KEYS.js';
import type { CmcdEvent } from './CmcdEvent.js';
import { isCmcdCustomKey } from './isCmcdCustomKey.js';

/**
 * Check if a key is a valid CMCD event key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD event key, `false` otherwise.
 *
 * @group CMCD
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/isCmcdEventKey.test.ts#example}
 */
export function isCmcdEventKey(key: string): key is keyof CmcdEvent {
	return CMCD_COMMON_KEYS.includes(key as any) ||
		CMCD_EVENT_KEYS.includes(key as any) ||
		isCmcdCustomKey(key as any);
}
