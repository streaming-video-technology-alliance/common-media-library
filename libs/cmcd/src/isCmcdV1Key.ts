import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const CMCD_V1_KEY_SET: ReadonlySet<string> = new Set(CMCD_V1_KEYS)

/**
 * Filter function for CMCD v1 keys.
 *
 * @param key - The CMCD key to filter.
 *
 * @returns `true` if the key should be included, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdV1Key.test.ts#example}
 */
export function isCmcdV1Key(key: string): key is CmcdKey {
	return CMCD_V1_KEY_SET.has(key) || isCmcdCustomKey(key as CmcdKey)
}
