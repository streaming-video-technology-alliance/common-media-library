import type { Cmcd } from './Cmcd.ts'

/**
 * A CMCD key including V1-only keys.
 *
 * @public
 */
export type CmcdKey = keyof Cmcd | 'nrr';
