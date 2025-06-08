import type { SampleEntryBox } from './SampleEntryBox.js';

/**
 * ISO/IEC 14496-15:2014 - 12.1.3.1 avc1/2/3/4, hev1, hvc1, encv
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type VisualSampleEntryBox<T extends 'avc1' | 'avc2' | 'avc3' | 'avc4' | 'hev1' | 'hvc1' | 'encv' = 'avc1' | 'avc2' | 'avc3' | 'avc4' | 'hev1' | 'hvc1' | 'encv'> = SampleEntryBox & {
	type: T;
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
};
