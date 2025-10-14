import type { CmcdHeaderField } from './CmcdHeaderField.ts'
import type { CmcdKey } from './CmcdKey.ts'

/**
 * A map of CMCD header fields to CMCD keys.
 *
 *
 * @beta
 */
export type CmcdHeaderMap = Record<CmcdHeaderField, CmcdKey[]>;
