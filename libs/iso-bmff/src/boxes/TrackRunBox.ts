import type { FullBox } from './FullBox.ts'
import type { TrackRunSample } from './TrackRunSample.ts'

/**
 * Track Run Box (`trun`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.8
 *
 * Note: the 'trun' box has a direct relation to the 'tfhd' box for defaults.
 * These defaults are not set explicitly here, but are left to resolve for the user.
 * `resolveTrunSamples` resolves the defaults for each sample.
 *
 * @public
 */
export type TrackRunBox = FullBox & {
	type: 'trun'
	dataOffset?: number
	firstSampleFlags?: number
	samples: TrackRunSample[]
}
