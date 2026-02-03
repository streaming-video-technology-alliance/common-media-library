import { CMCD_EVENT_KEYS } from './CMCD_EVENT_KEYS.ts'
import type { Cmcd } from './Cmcd.ts'
import { isCmcdRequestKey } from './isCmcdRequestKey.ts'
import { isCmcdResponseReceivedKey } from './isCmcdResponseReceivedKey.ts'

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
export function isCmcdEventKey(key: string): key is keyof Cmcd {
	return isCmcdRequestKey(key) ||
		isCmcdResponseReceivedKey(key) ||
		CMCD_EVENT_KEYS.includes(key as any)
}
