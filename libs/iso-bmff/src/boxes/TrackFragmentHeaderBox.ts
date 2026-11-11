import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 *
 * @public
 */
export type TrackFragmentHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfhd'
	trackId: number
	baseDataOffset?: V
	sampleDescriptionIndex?: number
	defaultSampleDuration?: number
	defaultSampleSize?: number
	defaultSampleFlags?: number
}
