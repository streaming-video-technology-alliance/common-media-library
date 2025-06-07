import type { FullBox } from './FullBox.js';
import type { TrackRunSample } from './TrackRunSample.js';

/**
 * Track Fragment Run Box - 'trun'
 */
export type TrackFragmentRunBox = FullBox & {
	type: 'trun';
	sampleCount: number;
	dataOffset?: number;
	firstSampleFlags?: number;
	samples: TrackRunSample[];
};
