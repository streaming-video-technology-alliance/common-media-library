import type { Cmcd } from '@svta/cml-cmcd/Cmcd.js';
import type { Request } from '@svta/cml-utils/Request.js';

/**
 * Common Media Request.
 *
 * @group Request
 *
 * @beta
 */
export type CommonMediaRequest = Request<{ cmcd: Cmcd }>;
