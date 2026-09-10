import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'

const CUSTOM_KEY = /^[a-z0-9.]+-[a-z0-9.-]+$/
const CUSTOM_SPEC: CmcdKeySpec = { type: 'custom', modes: 'both', max: 64 }

/** The spec of a reserved key, the custom spec for a hyphenated lowercase key, else `undefined`. */
export function getKeySpec(key: string): CmcdKeySpec | undefined {
	return CMCD_KEY_SPECS[key] ?? (CUSTOM_KEY.test(key) ? CUSTOM_SPEC : undefined)
}
