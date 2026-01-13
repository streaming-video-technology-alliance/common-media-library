import type { IsoBoxType } from '../IsoBoxType.ts'
import type { AudioSampleEntryType } from './AudioSampleEntryType.ts'
import type { SampleEntryBox } from './SampleEntryBox.ts'

/**
 * Child boxes of AudioSampleEntryBox
 *
 * @public
 */
export type AudioSampleEntryBoxChild = any;

/**
 * ISO/IEC 14496-12:2012 - 8.5.2.2 mp4a box (use AudioSampleEntry definition and naming)
 *
 * @public
 */
export type AudioSampleEntryBox<T extends IsoBoxType = AudioSampleEntryType> = SampleEntryBox & {
	type: T;
	reserved2: number[];
	channelcount: number;
	samplesize: number;
	preDefined: number;
	reserved3: number;
	samplerate: number;
	boxes: AudioSampleEntryBoxChild[];
};
