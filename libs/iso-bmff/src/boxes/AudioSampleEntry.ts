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
	reserved2: number[]
	channelCount: number
	sampleSize: number
	preDefined: number
	reserved3: number
	sampleRate: number
	boxes: AudioSampleEntryChild[]
}
