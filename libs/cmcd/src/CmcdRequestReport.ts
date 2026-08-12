import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_REQUEST_PROVENANCE } from './CMCD_REQUEST_PROVENANCE.ts'
import type { Cmcd } from './Cmcd.ts'

/**
 * A report of a CMCD request.
 *
 * @public
 */
export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
		[CMCD_REQUEST_PROVENANCE]: string;
	} & D;
	headers: Record<string, string>;
}
