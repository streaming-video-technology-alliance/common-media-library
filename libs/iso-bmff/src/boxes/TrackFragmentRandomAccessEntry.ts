import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Track fragment random access entry
 *
 * @public
 */
export type TrackFragmentRandomAccessEntry<V extends IsoInt64 = number> = {
	time: V
	moofOffset: V
	trafNumber: number
	trunNumber: number
	sampleNumber: number
}
