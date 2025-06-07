import type { FullBox } from './FullBox.js';

/**
 * Track Encryption Box - 'tenc'
 */
export type TrackEncryptionBox = FullBox & {
	type: 'tenc';
	defaultIsProtected: number;
	defaultPerSampleIVSize: number;
	defaultKID: Uint8Array;
	defaultConstantIVSize?: number;
	defaultConstantIV?: Uint8Array;
};
