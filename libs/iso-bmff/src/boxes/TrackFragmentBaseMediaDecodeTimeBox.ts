import type { FullBox } from './FullBox.ts';

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 *
 *
 * @beta
 */
export type TrackFragmentBaseMediaDecodeTimeBox = FullBox & {
	type: 'tfdt';
	baseMediaDecodeTime: number;
};
