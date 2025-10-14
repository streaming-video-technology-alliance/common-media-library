import type { Cmcd } from '@svta/cml-cmcd';
import type { Request } from '@svta/cml-utils';

/**
 * Common Media Request.
 *
 *
 * @beta
 */
export type CommonMediaRequest = Request<{ cmcd: Cmcd }>;
