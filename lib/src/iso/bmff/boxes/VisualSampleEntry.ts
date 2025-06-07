import type { Box } from './Box.js';
import type { ContainerBox } from './ContainerBox.js';
import type { SampleEntry } from './SampleEntry.js';

/**
 * Visual Sample Entry - 'avc1', 'avc2', 'avc3', 'avc4', 'hev1', 'hvc1', etc.
 */
export type VisualSampleEntry = SampleEntry & ContainerBox<Box> & {
	width: number;
	height: number;
	horizresolution: number;
	vertresolution: number;
	frameCount: number;
	compressorName: string;
	depth: number;
};
