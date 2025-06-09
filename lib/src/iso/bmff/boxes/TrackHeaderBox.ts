import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackHeaderBox = FullBox & {
	type: 'tkhd';
	creationTime: number;
	modificationTime: number;
	trackId: number;
	reserved1: number;
	duration: number;
	reserved2: number[];
	layer: number;
	alternateGroup: number;
	volume: number;
	reserved3: number;
	matrix: number[];
	width: number;
	height: number;
};
