import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.ts'
import { CMCD_EVENT_KEYS } from './CMCD_EVENT_KEYS.ts'
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.ts'
import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.ts'
import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.ts'
import type { CmcdKey } from './CmcdKey.ts'

const keySet = new Set([...CMCD_V1_KEYS, ...CMCD_COMMON_KEYS, ...CMCD_REQUEST_KEYS, ...CMCD_RESPONSE_KEYS, ...CMCD_EVENT_KEYS])

/**
 * A list of all CMCD keys.
 *
 * @public
 */
export const CMCD_KEYS: CmcdKey[] = Array.from(keySet)
