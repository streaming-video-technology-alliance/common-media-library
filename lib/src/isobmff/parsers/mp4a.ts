import { UINT } from '../fields/UINT';
import type { IsoView } from '../IsoView';
import type { SampleEntry } from './avc1';

export type AudioSampleEntry = SampleEntry & {
	reserved2: number[];
	channelcount: number;
	samplesize: number;
	preDefined: number;
	reserved3: number;
	samplerate: number;
	esds: Uint8Array;
};

// ISO/IEC 14496-12:2012 - 8.5.2.2 mp4a box (use AudioSampleEntry definition and naming)
export function mp4a(view: IsoView): AudioSampleEntry {
	const { readArray, readUint, readTemplate, readData } = view;

	return {
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		reserved2: readArray(UINT, 4, 2),
		channelcount: readUint(2),
		samplesize: readUint(2),
		preDefined: readUint(2),
		reserved3: readUint(2),
		samplerate: readTemplate(4),
		esds: readData(-1),
	};
};
