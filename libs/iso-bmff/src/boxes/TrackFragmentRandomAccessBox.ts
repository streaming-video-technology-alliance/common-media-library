import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'
import type { TrackFragmentRandomAccessEntry } from './TrackFragmentRandomAccessEntry.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
 * @public
 */
export type TrackFragmentRandomAccessBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfra'
	trackId: number
	reserved: number
	numberOfEntry: number
	lengthSizeOfTrafNum: number
	lengthSizeOfTrunNum: number
	lengthSizeOfSampleNum: number
	entries: TrackFragmentRandomAccessEntry<V>[]
}
