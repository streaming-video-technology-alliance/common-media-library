import type { Cmcd } from './Cmcd.ts'
import type { CmcdEvent } from './CmcdEvent.ts'
import type { CmcdRequest } from './CmcdRequest.ts'

/**
 * All CMCD data types combined.
 *
 * @public
 */
export type CmcdData = Cmcd & CmcdRequest & CmcdEvent;
