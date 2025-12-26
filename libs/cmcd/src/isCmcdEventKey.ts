import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.ts'
import { CMCD_EVENT_KEYS } from './CMCD_EVENT_KEYS.ts'
import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.js'
import type { CmcdEvent } from './CmcdEvent.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

/**
 * Check if a key is a valid CMCD event key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD event key, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdEventKey.test.ts#example}
 */
export function isCmcdEventKey(key: string): key is keyof CmcdEvent {
	return CMCD_COMMON_KEYS.includes(key as any) ||
		CMCD_EVENT_KEYS.includes(key as any) ||
		CMCD_RESPONSE_KEYS.includes(key as any) ||
		isCmcdCustomKey(key as any)
}
