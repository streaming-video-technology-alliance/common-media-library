import type { Box } from './Box.js';
import type { ContainerBox } from './ContainerBox.js';
import type { SampleEntry } from './SampleEntry.js';

/**
 * Audio Sample Entry - 'mp4a', etc.
 */
export type AudioSampleEntry = SampleEntry & ContainerBox<Box> & {
	channelcount: number;
	samplesize: number;
	samplerate: number;
};
