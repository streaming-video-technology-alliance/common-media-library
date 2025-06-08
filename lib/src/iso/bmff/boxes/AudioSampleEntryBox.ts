import type { SampleEntryBox } from './SampleEntryBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.5.2.2 mp4a box (use AudioSampleEntry definition and naming)
 *
 * @group ISOBMFF
 *
 * @beta
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
