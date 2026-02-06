import type { Cmcd } from '@svta/cml-cmcd'
import type { HttpRequest } from '@svta/cml-utils'

/**
 * Common Media Request.
 *
 * @public
 */
export type CommonMediaRequest<C extends { cmcd: Cmcd } = { cmcd: Cmcd }> = HttpRequest<C>;
