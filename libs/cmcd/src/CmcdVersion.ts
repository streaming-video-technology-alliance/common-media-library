import type { CMCD_V1 } from './CMCD_V1.ts'
import type { CMCD_V2 } from './CMCD_V2.ts'

/**
 * The version of the CMCD specification.
 *
 * @public
 */
export type CmcdVersion = typeof CMCD_V1 | typeof CMCD_V2
