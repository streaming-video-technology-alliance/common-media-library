import type { Cmcd } from './Cmcd.ts'
import type { CmcdV1 } from './CmcdV1.ts'

/**
 * A CMCD key of any version.
 *
 * @public
 */
export type CmcdKey = keyof Cmcd | keyof CmcdV1;
