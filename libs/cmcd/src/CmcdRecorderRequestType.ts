import type { ValueOf } from '@svta/cml-utils'

/**
 * Manifest or playlist request classification.
 *
 * @public
 */
export const CMCD_RECORDER_REQUEST_TYPE_MANIFEST = 'manifest' as const

/**
 * Media segment request classification.
 *
 * @public
 */
export const CMCD_RECORDER_REQUEST_TYPE_SEGMENT = 'segment' as const

/**
 * CMCD event-mode report request classification (POST).
 *
 * @public
 */
export const CMCD_RECORDER_REQUEST_TYPE_EVENT = 'event' as const

/**
 * Fallback classification for requests the recorder did not recognize
 * as manifest, segment, or event.
 *
 * @public
 */
export const CMCD_RECORDER_REQUEST_TYPE_UNKNOWN = 'unknown' as const

/**
 * Classification of a captured request, used by `CmcdReportRecorder`
 * for filtering.
 *
 * @enum
 *
 * @public
 */
export const CmcdRecorderRequestType = {
	MANIFEST: CMCD_RECORDER_REQUEST_TYPE_MANIFEST as typeof CMCD_RECORDER_REQUEST_TYPE_MANIFEST,
	SEGMENT: CMCD_RECORDER_REQUEST_TYPE_SEGMENT as typeof CMCD_RECORDER_REQUEST_TYPE_SEGMENT,
	EVENT: CMCD_RECORDER_REQUEST_TYPE_EVENT as typeof CMCD_RECORDER_REQUEST_TYPE_EVENT,
	UNKNOWN: CMCD_RECORDER_REQUEST_TYPE_UNKNOWN as typeof CMCD_RECORDER_REQUEST_TYPE_UNKNOWN,
} as const

/**
 * @public
 */
export type CmcdRecorderRequestType = ValueOf<typeof CmcdRecorderRequestType>
