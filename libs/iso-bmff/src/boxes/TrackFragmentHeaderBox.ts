import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Track Fragment Header Box (`tfhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.7
 *
 * The `flags` field marks the optional fields. The writer writes an optional field only when its flag is set.
 *
 * @public
 */
export type TrackFragmentHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tfhd'
	trackId: number
	/** The base offset for the data offsets of the track fragment. Flag 0x000001 marks the field. */
	baseDataOffset?: V
	/** The index of the sample description in the `stsd` box. Flag 0x000002 marks the field. */
	sampleDescriptionIndex?: number
	/** The default duration of a sample. Flag 0x000008 marks the field. */
	defaultSampleDuration?: number
	/** The default size of a sample. Flag 0x000010 marks the field. */
	defaultSampleSize?: number
	/** The default flags of a sample. Flag 0x000020 marks the field. */
	defaultSampleFlags?: number
}
