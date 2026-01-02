import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD `query` transmission mode.
 *
 * @public
 */
export const CMCD_QUERY = 'query' as const

/**
 * CMCD `headers` transmission mode.
 *
 * @public
 */
export const CMCD_HEADERS = 'headers' as const

/**
 * CMCD `json` transmission mode.
 *
 * @public
 *
 * @deprecated JSON transmission mode is deprecated and will be removed in future versions.
 */
export const CMCD_JSON = 'json' as const

/**
 * CMCD transmission modes.
 *
 *
 * @enum
 *
 * @public
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

} as const

/**
 * @public
 */
export type CmcdTransmissionMode = ValueOf<typeof CmcdTransmissionMode>;
