import type { FullBox } from './FullBox.ts'

/**
 * Track Extends Box (`trex`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.3
 *
 * @public
 */
export type TrackExtendsBox = FullBox & {
	type: 'trex'
	trackId: number
	defaultSampleDescriptionIndex: number
	defaultSampleDuration: number
	defaultSampleSize: number
	defaultSampleFlags: number
}
