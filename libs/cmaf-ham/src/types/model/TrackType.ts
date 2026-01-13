import type { ValueOf } from '@svta/cml-utils'

/**
 * CMAF-HAM Audio Track Type
 *
 * @alpha
 */
export const AUDIO = 'audio' as const

/**
 * CMAF-HAM Video Track Type
 *
 * @alpha
 */
export const VIDEO = 'video' as const

/**
 * CMAF-HAM Text Track Type
 *
 * @alpha
 */
export const TEXT = 'text' as const

/**
 * CMAF-HAM Image Track Type
 *
 * @alpha
 */
export const IMAGE = 'image' as const

/**
 * CMAF-HAM Track Type
 *
 * @alpha
 */
export const TrackType = {
	AUDIO: AUDIO as typeof AUDIO,
	VIDEO: VIDEO as typeof VIDEO,
	TEXT: TEXT as typeof TEXT,
	IMAGE: IMAGE as typeof IMAGE,
} as const

/**
 * CMAF-HAM Track Type
 *
 * @alpha
 */
export type TrackType = ValueOf<typeof TrackType>
