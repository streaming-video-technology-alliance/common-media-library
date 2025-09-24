import type { FullBox } from './FullBox.js';
import type { TrackRunSample } from './TrackRunSample.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box
 *
 * Note: the 'trun' box has a direct relation to the 'tfhd' box for defaults.
 * These defaults are not set explicitly here, but are left to resolve for the user.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackRunBox = FullBox & {
	type: 'trun';
	sampleCount: number;
	dataOffset?: number;
	firstSampleFlags?: number;
	samples: TrackRunSample[];
};
