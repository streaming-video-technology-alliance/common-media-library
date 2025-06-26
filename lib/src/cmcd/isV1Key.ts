import { CMCD_V1_KEYS } from "./CMCD_V1_KEYS.js";
import type { CmcdCustomKey } from "./CmcdCustomKey.js";
import type { CmcdKey } from "./CmcdKey.js";
import { isCmcdCustomKey } from "./isCmcdCustomKey.js";

/**
 * Filter function for CMCD v1 keys.
 *
 * @param key - The CMCD key to filter.
 *
 * @returns `true` if the key should be included, `false` otherwise.
 *
 * @group CMCD
 *
 * @beta
 */
export function isV1Key(key: CmcdKey): boolean {
	return CMCD_V1_KEYS.includes(key as Exclude<CmcdKey, CmcdCustomKey>) || isCmcdCustomKey(key);
}
