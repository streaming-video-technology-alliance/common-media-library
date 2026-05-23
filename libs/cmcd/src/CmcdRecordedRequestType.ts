import type { ValueOf } from '@svta/cml-utils'

/**
 * Manifest or playlist request classification.
 *
 * @public
 */
export const CMCD_RECORDED_REQUEST_TYPE_MANIFEST = 'manifest' as const

/**
 * Media segment request classification.
 *
 * @public
 */
export const CMCD_RECORDED_REQUEST_TYPE_SEGMENT = 'segment' as const

/**
 * CMCD event-mode report request classification (POST to a URL in
 * `eventTargetUrls`).
 *
 * @public
 */
export const CMCD_RECORDED_REQUEST_TYPE_EVENT = 'event' as const

/**
 * Fallback classification for requests the recorder did not recognize
 * as manifest, segment, or event.
 *
 * @public
 */
export const CMCD_RECORDED_REQUEST_TYPE_UNKNOWN = 'unknown' as const

/**
 * Classification of a captured request, used by `CmcdReportRecorder`
 * for filtering.
 *
 * @enum
 *
 * @public
 */
export const CmcdRecordedRequestType = {
	MANIFEST: CMCD_RECORDED_REQUEST_TYPE_MANIFEST as typeof CMCD_RECORDED_REQUEST_TYPE_MANIFEST,
	SEGMENT: CMCD_RECORDED_REQUEST_TYPE_SEGMENT as typeof CMCD_RECORDED_REQUEST_TYPE_SEGMENT,
	EVENT: CMCD_RECORDED_REQUEST_TYPE_EVENT as typeof CMCD_RECORDED_REQUEST_TYPE_EVENT,
	UNKNOWN: CMCD_RECORDED_REQUEST_TYPE_UNKNOWN as typeof CMCD_RECORDED_REQUEST_TYPE_UNKNOWN,
} as const

/**
 * @public
 */
export type CmcdRecordedRequestType = ValueOf<typeof CmcdRecordedRequestType>
