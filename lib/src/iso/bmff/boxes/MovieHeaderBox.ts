import type { FullBox } from './FullBox.js';

/**
 * Movie Header Box - 'mvhd'
 */
export type MovieHeaderBox = FullBox & {
	type: 'mvhd';
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	rate: number;
	volume: number;
	matrix: number[];
	nextTrackId: number;
};
