import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.3 Track Extends Box
 *
 * @public
 */
export type TrackExtendsBox = FullBox & {
	type: 'trex';
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};

/**
 * @public
 */
export type trex = TrackExtendsBox;
