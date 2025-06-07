import type { FullBox } from './FullBox.js';
import type { TrackFragmentRandomAccessEntry } from './TrackFragmentRandomAccessEntry.js';

/**
 * Track Fragment Random Access Box - 'tfra'
 */
export type TrackFragmentRandomAccessBox = FullBox & {
	type: 'tfra';
	trackId: number;
	lengthSizeOfTrafNum: number;
	lengthSizeOfTrunNum: number;
	lengthSizeOfSampleNum: number;
	numberOfEntry: number;
	entries: TrackFragmentRandomAccessEntry[];
};
