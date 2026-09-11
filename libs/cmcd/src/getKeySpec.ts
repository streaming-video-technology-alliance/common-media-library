import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const CUSTOM_SPEC: CmcdKeySpec = { type: 'custom', modes: 'both', max: 64 }

/** The spec of a reserved key, the custom spec for a valid custom key, else `undefined`. */
export function getKeySpec(key: string): CmcdKeySpec | undefined {
	if (Object.hasOwn(CMCD_KEY_SPECS, key)) {
		return CMCD_KEY_SPECS[key]
	}
	return isCmcdCustomKey(key as CmcdKey) ? CUSTOM_SPEC : undefined
}
