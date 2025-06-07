import type { FullBox } from './FullBox.js';

/**
 * Track Extends Box - 'trex'
 */
export type TrackExtendsBox = FullBox & {
	type: 'trex';
	trackId: number;
	defaultSampleDescriptionIndex: number;
	defaultSampleDuration: number;
	defaultSampleSize: number;
	defaultSampleFlags: number;
};
