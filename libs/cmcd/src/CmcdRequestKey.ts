import type { CmcdRequest } from './CmcdRequest.ts'

/**
 * A CMCD request key.
 *
 * @public
 */
export type CmcdRequestKey = keyof CmcdRequest | 'nrr';
