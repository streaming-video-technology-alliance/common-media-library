import type { Cmcd } from './Cmcd.ts'
import type { CmcdV1 } from './CmcdV1.ts'

/**
 * A CMCD key including V1-only keys.
 *
 * @public
 */
export type CmcdKey = keyof Cmcd | keyof CmcdV1;
