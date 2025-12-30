import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 23001-7:2011 - 8.2 Track Encryption Box
 *
 * @public
 */
export type TrackEncryptionBox = FullBox & {
	type: 'tenc';
	defaultIsEncrypted: number;
	defaultIvSize: number;
	defaultKid: number[];
};
