import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.7 Track Fragment Header Box
 *
 * @group ISOBMFF
 *
 * @beta
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
