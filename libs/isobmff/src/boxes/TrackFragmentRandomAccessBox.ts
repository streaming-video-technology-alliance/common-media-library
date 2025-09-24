import type { FullBox } from './FullBox.js';
import type { TrackFragmentRandomAccessEntry } from './TrackFragmentRandomAccessEntry.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentRandomAccessBox = FullBox & {
	type: 'tfra';
	trackId: number;
	reserved: number;
	numberOfEntry: number;
	lengthSizeOfTrafNum: number;
	lengthSizeOfTrunNum: number;
	lengthSizeOfSampleNum: number;
	entries: TrackFragmentRandomAccessEntry[];
};
