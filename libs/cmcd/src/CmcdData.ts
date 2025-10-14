import type { Cmcd } from './Cmcd.ts';
import type { CmcdEvent } from './CmcdEvent.ts';
import type { CmcdRequest } from './CmcdRequest.ts';
import type { CmcdResponse } from './CmcdResponse.ts';

/**
 * All CMCD data types combined.
 *
 *
 * @beta
 */
export type CmcdData = Cmcd & CmcdRequest & CmcdEvent & CmcdResponse;
