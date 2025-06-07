import type { FullBox } from './FullBox.js';

/**
 * Track Fragment Base Media Decode Time Box - 'tfdt'
 */
export type TrackFragmentBaseMediaDecodeTimeBox = FullBox & {
	type: 'tfdt';
	baseMediaDecodeTime: number;
};
