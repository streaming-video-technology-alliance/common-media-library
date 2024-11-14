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
	return {
		reserved1: view.readArray(UINT, 1, 6),
		dataReferenceIndex: view.readUint(2),
		preDefined1: view.readUint(2),
		reserved2: view.readUint(2),
		preDefined2: view.readArray(UINT, 4, 3),
		width: view.readUint(2),
		height: view.readUint(2),
		horizresolution: view.readTemplate(4),
		vertresolution: view.readTemplate(4),
		reserved3: view.readUint(4),
		frameCount: view.readUint(2),
		compressorName: view.readArray(UINT, 1, 32),
		depth: view.readUint(2),
		preDefined3: view.readInt(2),
		config: view.readData(-1),
	};
};
