import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieHeaderBox = FullBox & {
	type: 'mvhd';
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	rate: number;
	volume: number;
	reserved1: number;
	reserved2: number[];
	matrix: number[];
	preDefined: number[];
	nextTrackId: number;
};
