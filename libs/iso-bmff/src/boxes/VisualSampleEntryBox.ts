import type { SampleEntryBox } from './SampleEntryBox.ts'
import type { VisualSampleEntryType } from './VisualSampleEntryType.ts'

/**
 * Child boxes of VisualSampleEntryBox
 *
 * @public
 */
export type VisualSampleEntryBoxChild = any;

/**
 * ISO/IEC 14496-15:2014 - 12.1.3.1 avc1/2/3/4, hev1, hvc1, encv
 *
 * @public
 */
export type VisualSampleEntryBox<T extends VisualSampleEntryType = VisualSampleEntryType> = SampleEntryBox & {
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
	boxes: VisualSampleEntryBoxChild[];
};
