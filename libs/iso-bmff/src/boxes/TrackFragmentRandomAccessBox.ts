import type { FullBox } from './FullBox.ts'
import type { TrackFragmentRandomAccessEntry } from './TrackFragmentRandomAccessEntry.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.10 Track Fragment Random Access Box
 *
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
