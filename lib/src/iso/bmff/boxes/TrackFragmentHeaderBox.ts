import type { FullBox } from './FullBox.js';

/**
 * Track Fragment Header Box - 'tfhd'
 */
export type TrackFragmentHeaderBox = FullBox & {
	type: 'tfhd';
	trackId: number;
	baseDataOffset?: number;
	sampleDescriptionIndex?: number;
	defaultSampleDuration?: number;
	defaultSampleSize?: number;
	defaultSampleFlags?: number;
};
