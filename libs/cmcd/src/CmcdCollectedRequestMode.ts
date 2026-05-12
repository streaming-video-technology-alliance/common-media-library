import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD query reporting mode — CMCD data carried as a `CMCD=` URL
 * query parameter.
 *
 * @public
 */
export const CMCD_COLLECTED_REQUEST_MODE_QUERY = 'query' as const

/**
 * CMCD header reporting mode — CMCD data carried as `Cmcd-*` HTTP
 * headers.
 *
 * @public
 */
export const CMCD_COLLECTED_REQUEST_MODE_HEADER = 'header' as const

/**
 * CMCD event reporting mode — CMCD data carried as a POST body to an
 * event-target URL.
 *
 * @public
 */
export const CMCD_COLLECTED_REQUEST_MODE_EVENT = 'event' as const

/**
 * Reporting mode under which a captured request was observed by
 * `CmcdRequestCollector`.
 *
 * @enum
 *
 * @public
 */
export const CmcdCollectedRequestMode = {
	QUERY: CMCD_COLLECTED_REQUEST_MODE_QUERY as typeof CMCD_COLLECTED_REQUEST_MODE_QUERY,
	HEADER: CMCD_COLLECTED_REQUEST_MODE_HEADER as typeof CMCD_COLLECTED_REQUEST_MODE_HEADER,
	EVENT: CMCD_COLLECTED_REQUEST_MODE_EVENT as typeof CMCD_COLLECTED_REQUEST_MODE_EVENT,
} as const

/**
 * @public
 */
export type CmcdCollectedRequestMode = ValueOf<typeof CmcdCollectedRequestMode>
