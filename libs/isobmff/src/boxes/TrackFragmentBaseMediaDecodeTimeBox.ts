import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentBaseMediaDecodeTimeBox = FullBox & {
	type: 'tfdt';
	baseMediaDecodeTime: number;
};
