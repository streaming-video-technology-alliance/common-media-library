import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const CUSTOM_KEY_SPEC: CmcdKeySpec = { type: 'custom', omitDefault: false, max: 64, v1Max: Infinity }

/**
 * Returns the row of a key in the key table.
 *
 * @param key - The key to look up.
 *
 * @returns The row of a reserved key, the custom row for a valid custom key, or `undefined`.
 *
 * @internal
 */
export function getKeySpec(key: string): CmcdKeySpec | undefined {
	if (Object.prototype.hasOwnProperty.call(CMCD_KEY_SPECS, key)) {
		return CMCD_KEY_SPECS[key]
	}

	return isCmcdCustomKey(key as CmcdKey) ? CUSTOM_KEY_SPEC : undefined
}
