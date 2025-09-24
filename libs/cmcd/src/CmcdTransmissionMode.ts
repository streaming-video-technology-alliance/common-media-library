import type { ValueOf } from '@svta/cml-utils/ValueOf.js';
import { CMCD_HEADERS } from './CMCD_HEADERS.js';
import { CMCD_JSON } from './CMCD_JSON.js';
import { CMCD_QUERY } from './CMCD_QUERY.js';

/**
 * CMCD transmission modes.
 *
 * @group CMCD
 *
 * @enum
 *
 * @beta
 */
export const CmcdTransmissionMode = {
	/**
	 * JSON
	 *
	 * @deprecated JSON transmission mode is deprecated and will be removed in future versions.
	 */
	JSON: CMCD_JSON as typeof CMCD_JSON,

	/**
	 * Query string
	 */
	QUERY: CMCD_QUERY as typeof CMCD_QUERY,

	/**
	 * Request headers
	 */
	HEADERS: CMCD_HEADERS as typeof CMCD_HEADERS,

} as const;

/**
 * @beta
 */
export type CmcdTransmissionMode = ValueOf<typeof CmcdTransmissionMode>;
