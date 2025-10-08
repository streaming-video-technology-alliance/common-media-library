import type { Cmcd } from './Cmcd.js';
import type { CmcdEvent } from './CmcdEvent.js';
import type { CmcdRequest } from './CmcdRequest.js';
import type { CmcdResponse } from './CmcdResponse.js';

/**
 * All CMCD data types combined.
 *
 *
 * @beta
 */
export type CmcdData = Cmcd & CmcdRequest & CmcdEvent & CmcdResponse;
