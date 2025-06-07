import type { FullBox } from './FullBox.js';

/**
 * Track Header Box - 'tkhd'
 */
export type TrackHeaderBox = FullBox & {
	type: 'tkhd';
	creationTime: number;
	modificationTime: number;
	trackId: number;
	duration: number;
	layer: number;
	alternateGroup: number;
	volume: number;
	matrix: number[];
	width: number;
	height: number;
};
