import type { IsoBoxType } from '../IsoBoxType.ts'
import type { AudioSampleEntryType } from './AudioSampleEntryType.ts'
import type { SampleEntry } from './SampleEntry.ts'

/**
 * Child boxes of Audio Sample Entry Box
 *
 * @public
 */
export type AudioSampleEntryChild = any

/**
 * Audio Sample Entry Box, such as `mp4a` or `enca`.
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * @public
 */
export type AudioSampleEntry<T extends IsoBoxType = AudioSampleEntryType> = SampleEntry & {
	type: T
	/** The `entry_version` field of `AudioSampleEntryV1`: the first 16 bits after `data_reference_index`. An `AudioSampleEntry` of ISO/IEC 14496-12:2015 has 0 in these bits. `writeAudioSampleEntry` writes 0 for a missing value. */
	entryVersion?: number
	channelCount: number
	sampleSize: number
	/** The `pre_defined` field. `writeAudioSampleEntry` writes 0 for a missing value. */
	preDefined?: number
	sampleRate: number
	boxes: AudioSampleEntryChild[]
}
