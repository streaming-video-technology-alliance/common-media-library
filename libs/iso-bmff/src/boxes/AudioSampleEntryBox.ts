import type { SampleEntryBox } from './SampleEntryBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.5.2.2 mp4a box (use AudioSampleEntry definition and naming)
 *
 * @public
 */
export type AudioSampleEntryBox<T extends 'mp4a' | 'enca' = 'mp4a' | 'enca'> = SampleEntryBox & {
	type: T;
	reserved2: number[];
	channelcount: number;
	samplesize: number;
	preDefined: number;
	reserved3: number;
	samplerate: number;
	esds: Uint8Array;
};

/**
 * @public
 */
export type mp4a = AudioSampleEntryBox<'mp4a'>;

/**
 * @public
 */
export type enca = AudioSampleEntryBox<'enca'>;
