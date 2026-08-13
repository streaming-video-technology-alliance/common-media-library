import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_REQUEST_PROVENANCE } from './CMCD_REQUEST_PROVENANCE.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestProvenance } from './CmcdRequestProvenance.ts'

/**
 * A report of a CMCD request.
 *
 * The provenance member is optional so the type stays constructible by
 * consumers that build or mock request reports; every request returned by
 * `CmcdReporter.createRequestReport()` carries it.
 *
 * @public
 */
export type CmcdRequestReport<D = unknown> = HttpRequest & {
	customData: {
		cmcd: Cmcd;
		[CMCD_REQUEST_PROVENANCE]?: CmcdRequestProvenance;
	} & D;
	headers: Record<string, string>;
}
