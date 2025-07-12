import { CMCD_COMMON_KEYS } from './CMCD_COMMON_KEYS.js';
import { CMCD_EVENT_KEYS } from './CMCD_EVENT_KEYS.js';
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.js';
import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.js';
import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.js';
import type { CmcdKey } from './CmcdKey.js';

const keySet = new Set([...CMCD_V1_KEYS, ...CMCD_COMMON_KEYS, ...CMCD_REQUEST_KEYS, ...CMCD_RESPONSE_KEYS, ...CMCD_EVENT_KEYS]);

/**
 * A list of all CMCD keys.
 *
 * @group CMCD
 *
 * @beta
 */
export const CMCD_KEYS: CmcdKey[] = Array.from(keySet);
