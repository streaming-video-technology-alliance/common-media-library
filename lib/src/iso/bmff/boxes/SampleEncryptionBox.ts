import type { FullBox } from './FullBox.js';

/**
 * Subsample Encryption
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SubsampleEncryption = {
	bytesOfClearData: number;
	bytesOfProtectedData: number;
};

/**
 * Encrypted Sample
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EncryptedSample = {
	initializationVector?: Uint8Array;
	subsampleEncryption?: SubsampleEncryption[];
};

/**
 * Sample Encryption Box - 'senc'
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleEncryptionBox = FullBox & {
	type: 'senc';
	sampleCount: number;
	samples: EncryptedSample[];
};
