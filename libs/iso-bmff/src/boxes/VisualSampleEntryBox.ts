import type { SampleEntryBox } from './SampleEntryBox.ts'
import type { VisualSampleEntryType } from './VisualSampleEntryType.ts'

/**
 * ISO/IEC 14496-15:2014 - 12.1.3.1 avc1/2/3/4, hev1, hvc1, encv
 *
 * @public
 */
export type VisualSampleEntryBox<T extends VisualSampleEntryType> = SampleEntryBox & {
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

/**
 * @public
 */
export type avc1 = VisualSampleEntryBox<'avc1'>;

/**
 * @public
 */
export type avc2 = VisualSampleEntryBox<'avc2'>;

/**
 * @public
 */
export type avc3 = VisualSampleEntryBox<'avc3'>;

/**
 * @public
 */
export type avc4 = VisualSampleEntryBox<'avc4'>;

/**
 * @public
 */
export type hev1 = VisualSampleEntryBox<'hev1'>;

/**
 * @public
 */
export type hvc1 = VisualSampleEntryBox<'hvc1'>;

/**
 * @public
 */
export type encv = VisualSampleEntryBox<'encv'>;
