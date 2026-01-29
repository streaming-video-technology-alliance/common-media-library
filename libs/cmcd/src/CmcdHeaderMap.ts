import type { CmcdHeaderField } from './CmcdHeaderField.ts'
import type { CmcdRequestKey } from './CmcdRequestKey.ts'

/**
 * A map of CMCD header fields to CMCD keys.
 *
 * @public
 */
export type CmcdHeaderMap = Record<CmcdHeaderField, CmcdRequestKey[]>;
