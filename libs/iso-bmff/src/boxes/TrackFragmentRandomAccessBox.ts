import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'
import type { TrackFragmentRandomAccessEntry } from './TrackFragmentRandomAccessEntry.ts'

/**
 * Track Fragment Random Access Box (`tfra`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.10
 *
 * @public
 */
export type TrackFragmentRandomAccessBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfra'
	trackId: number
	numberOfEntry: number
	/** The byte length of the `trafNumber` field of each entry, minus one. */
	lengthSizeOfTrafNum: number
	/** The byte length of the `trunNumber` field of each entry, minus one. */
	lengthSizeOfTrunNum: number
	/** The byte length of the `sampleNumber` field of each entry, minus one. */
	lengthSizeOfSampleNum: number
	entries: TrackFragmentRandomAccessEntry<V>[]
}
