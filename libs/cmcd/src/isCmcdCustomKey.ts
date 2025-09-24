import type { CmcdKey } from './CmcdKey.js';

const CUSTOM_KEY_REGEX = /^[a-zA-Z0-9-.]+-[a-zA-Z0-9-.]+$/;

/**
 * Check if a key is a custom key.
 *
 * @param key - The key to check.
 *
 * @returns `true` if the key is a custom key, `false` otherwise.
 *
 * @group CMCD
 *
 * @beta
 */
export function isCmcdCustomKey(key: CmcdKey): boolean {
	return CUSTOM_KEY_REGEX.test(key);
}
