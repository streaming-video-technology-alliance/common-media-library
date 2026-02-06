import type { HttpRequest } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'

/**
 * A report of a CMCD request.
 *
 * @public
 */
export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
	} & D;
	headers: Record<string, string>;
}
