import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackExtendsBox = FullBox & {
	type: 'trex';
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};
