import type { FullBox } from './FullBox.ts'
import type { TrackRunSample } from './TrackRunSample.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 *
 * Note: the 'trun' box has a direct relation to the 'tfhd' box for defaults.
 * These defaults are not set explicitly here, but are left to resolve for the user.
 *
 * @public
 */
export type TrackRunBox = FullBox & {
	type: 'trun';
	sampleCount: number;
	dataOffset?: number;
	firstSampleFlags?: number;
	samples: TrackRunSample[];
};
