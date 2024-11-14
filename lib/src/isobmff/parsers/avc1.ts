import { UINT } from '../fields/UINT';
import type { IsoView } from '../IsoView';

export type SampleEntry = {
	reserved1: number[];
	dataReferenceIndex: number;
}

export type VisualSampleEntry = SampleEntry & {
	preDefined1: number;
	reserved2: number;
	preDefined2: number[];
	width: number;
	height: number;
	horizresolution: number;
	vertresolution: number;
	reserved3: number;
	frameCount: number;
	compressorName: number[];
	depth: number;
	preDefined3: number;
	config: Uint8Array;
}

// ISO/IEC 14496-15:2014 - avc1/2/3/4, hev1, hvc1, encv
export function avc1(view: IsoView): VisualSampleEntry {
	const { readArray, readUint, readInt, readTemplate, readData } = view;

	return {
		reserved1: readArray(UINT, 1, 6),
		dataReferenceIndex: readUint(2),
		preDefined1: readUint(2),
		reserved2: readUint(2),
		preDefined2: readArray(UINT, 4, 3),
		width: readUint(2),
		height: readUint(2),
		horizresolution: readTemplate(4),
		vertresolution: readTemplate(4),
		reserved3: readUint(4),
		frameCount: readUint(2),
		compressorName: readArray(UINT, 1, 32),
		depth: readUint(2),
		preDefined3: readInt(2),
		config: readData(-1),
	};
};
