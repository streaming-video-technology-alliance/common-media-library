import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.js'
import type { CmcdResponse } from './CmcdResponse.js'

/**
 * Check if a key is a valid CMCD response key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD request key, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdResponseReceivedKey.test.ts#example}
 */
export function isCmcdResponseReceivedKey(key: string): key is keyof CmcdResponse {
	return CMCD_RESPONSE_KEYS.includes(key as any)
}
