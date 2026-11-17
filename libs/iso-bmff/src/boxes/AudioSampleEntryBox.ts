import type { IsoBoxType } from '../IsoBoxType.ts'
import type { AudioSampleEntryType } from './AudioSampleEntryType.ts'
import type { SampleEntryBox } from './SampleEntryBox.ts'

/**
 * Child boxes of Audio Sample Entry Box
 *
 * @public
 */
export type AudioSampleEntryBoxChild = any

/**
 * Audio Sample Entry Box, such as `mp4a` or `enca`.
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * @public
 */
export type AudioSampleEntryBox<T extends IsoBoxType = AudioSampleEntryType> = SampleEntryBox & {
	type: T
	reserved2: number[]
	channelcount: number
	samplesize: number
	preDefined: number
	reserved3: number
	samplerate: number
	boxes: AudioSampleEntryBoxChild[]
}
