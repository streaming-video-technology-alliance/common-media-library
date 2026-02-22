import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.ts'
import type { Cmcd } from './Cmcd.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const CMCD_REQUEST_KEY_SET: ReadonlySet<string> = new Set(CMCD_REQUEST_KEYS)

/**
 * Check if a key is a valid CMCD request key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a valid CMCD request key, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdRequestKey.test.ts#example}
 */
export function isCmcdRequestKey(key: string): key is keyof Cmcd {
	return CMCD_REQUEST_KEY_SET.has(key) ||
		isCmcdCustomKey(key as CmcdKey)
}
